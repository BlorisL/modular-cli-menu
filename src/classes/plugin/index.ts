import { Action, ActionConfig } from "../action";
import { ActionFunction, ActionFunctionConfig } from "../action/function";
import { ActionGoTo, ActionGoToConfig } from "../action/goto";
import { I18n, Language, LanguageConfig } from "../language";
import { Menu, MenuConfig } from "../menu";
import { MenuChoices, MenuChoicesConfig } from "../menu/choices";

type PluginCollection = Record<string, Plugin>;
type MenuCollection = Record<string, Menu>;
type ActionCollection = Record<string, Action>;

type PluginConfig = {
    name: string;
    menus?: Array<MenuChoicesConfig>;
    actions?: Array<ActionFunctionConfig | ActionGoToConfig>;
    translations?: LanguageConfig[];
}

class Plugin {
    protected name: string;
    protected menus: MenuCollection = {};
    protected actions: ActionCollection = {};
    protected i18n: I18n = new I18n();

    public constructor(config: PluginConfig) {
        this.name = config.name;
        config.menus?.forEach(menuConfig => {
            let menu: Menu | undefined = undefined;
            switch(menuConfig.mode) {
                case MenuChoices.MODE_NAME:
                    menu = new MenuChoices(menuConfig as MenuChoicesConfig);
                    break;
                //case MenuInput.MODE_NAME:
                //    menu = new MenuInput(menuConfig as MenuInputConfig);
                //    break;
            }
            if(menu) {
                this.menus[menu.getName()] = menu;
            }
        });
        config.actions?.forEach(actionConfig => {
            let action: Action | undefined = undefined;
            switch(actionConfig.mode) {
                case ActionFunction.MODE_NAME:
                    action = new ActionFunction(actionConfig as ActionFunctionConfig);
                    break;
                case ActionGoTo.MODE_NAME:
                    action = new ActionGoTo(actionConfig as ActionGoToConfig);
                    break;
            }
            if(action) {
                this.actions[action.getName()] = action;
            }
        });
        if (config.translations) {
            this.addTranslations(config.translations);
        }
    }

    public getName(): string { return this.name; }

    public getMenus(): Menu[] { return Object.values(this.menus); }

    public getMenu(name: string): Menu | undefined { return this.menus[name]; }
    public addMenu(menu: Menu | MenuConfig | Array<Menu | MenuConfig>): this {
        const items = Array.isArray(menu) ? menu : [menu];

        items.forEach(item => {
            let instance: Menu | undefined = undefined;

            if (item instanceof Menu) {
                instance = item;
            } else {
                switch(item.mode) {
                    case MenuChoices.MODE_NAME:
                        instance = new MenuChoices(item as MenuChoicesConfig);
                        break;
                    //default:
                    //    throw new Error(`Menu mode "${item.mode}" non gestito`);
                }
            }

            if(instance) {
                this.menus[instance.getName()] = instance;
            }
        });

        return this;
    }

    public getActions(): Action[] { return Object.values(this.actions); }

    public getAction(name: string): Action | undefined { return this.actions[name]; }
    public addAction(action: Action | ActionConfig | Array<Action | ActionConfig>): this {
        const items = Array.isArray(action) ? action : [action];

        items.forEach(item => {
            let instance: Action | undefined = undefined;

            if (item instanceof Action) {
                instance = item;
            } else {
                switch(item.mode) {
                    case ActionFunction.MODE_NAME:
                        instance = new ActionFunction(item as ActionFunctionConfig);
                        break;
                    case ActionGoTo.MODE_NAME:
                        instance = new ActionGoTo(item as ActionGoToConfig);
                        break;
                    //default:
                    //    throw new Error(`Action mode "${item.mode}" non gestito`);
                }
            }

            if(instance) {
                this.actions[instance.getName()] = instance;
            }
        });

        return this;
    }

    public getTranslations(): Language[] | undefined { return this.i18n?.getAll(); }
    public addTranslations(languages: Language | LanguageConfig | Array<Language | LanguageConfig>): this {
        this.i18n.add(languages);

        return this;
    }
}

class Plugins {
    public static DEBUG = true;
    protected items: PluginCollection = {};

    public constructor(config: PluginConfig[]) {
        config.forEach(plugin => this.add(plugin));
    }

    public getAll(): Plugin[] { return Object.values(this.items); }

    public get(name: string): Plugin | undefined { return this.items[name]; }
    public add(plugins: Plugin | PluginConfig | Array<Plugin | PluginConfig>): this {
        if (!Array.isArray(plugins)) {
            plugins = [plugins];
        }
        plugins.forEach(plugin => {
            if (!(plugin instanceof Plugin)) {
                plugin = new Plugin(plugin);
            }
            this.items[plugin.getName()] = plugin;
        });
        this.checkParents();

        return this;
    }

    protected findMenuInPlugins(menuName: string): Menu | undefined {
        let menu: Menu | undefined = undefined;
        this.getAll().some(plugin => {
            menu = plugin.getMenu(menuName);
            return !!menu;
        });
        return menu;
    }
    public getMenu(menuName: string = '' , pluginName: string = ''): Menu | undefined {
        let menu: Menu | undefined = undefined;
        const plugin = this.get(pluginName);

        if(plugin) {
            menu = plugin.getMenu(menuName);
        } else {
            menu = this.findMenuInPlugins(menuName);
        }
        if(!menu) {
            menu = this.get('default')?.getMenu('main');
        }

        return menu;
    }
    
    protected findActionInPlugins(actionName: string): Action | undefined {
        let action: Action | undefined = undefined;
        this.getAll().some(plugin => {
            action = plugin.getAction(actionName);
            return !!action;
        });
        return action;
    }
    public getAction(actionName: string = '', pluginName: string = ''): Action | undefined {
        let action: Action | undefined = undefined;
        const plugin = this.get(pluginName);

        if(plugin) {
            action = plugin.getAction(actionName);
        } else {
            action = this.findActionInPlugins(actionName);
        }

        return action;
    }

    public getGlobalActions(): Action[] {
        let actions: Action[] = [];
        this.getAll().forEach(plugin => {
            actions = actions.concat(plugin.getActions().filter(action => action.isGlobal()));
        });

        return actions;
    }

    public async print(pluginName: string = '', menuName: string = '') {
        const menu = this.getMenu(pluginName, menuName);
        if (menu) {
            return await menu.print({
                findMenu: (name: string) => this.getMenu(name),
                findAction: (name: string) => this.getAction(name),
            });
        } else {
            return await this.getMenu('main')?.print({});
        }
    }

    public async run(pluginName: string = '', actionName: string = '') {
        const action = this.getAction(pluginName, actionName);
        if (action) {
            return await action.run({
                findMenu: (name: string) => this.getMenu(name),
                findAction: (name: string) => this.getAction(name),
            });
        } else {
            if(Plugins.DEBUG) {
                console.warn(`⚠️ Action "${actionName}" del plugin "${pluginName}" non trovata.`);
            }
            return;
        }
    }

    protected checkParents(): this {
        this.getAll().forEach(plugin => {
            plugin.getMenus().forEach(menu => {
                const parent = menu.getRawParent();
                if(parent && !menu.isParentSet()) {
                    const parentMenu = this.getMenu(parent as string);
                    if (parentMenu) {
                        menu.setParent(parentMenu);
                        if(parentMenu.getMode() === MenuChoices.MODE_NAME) {
                            (parentMenu as MenuChoices).add(menu.getName());
                            plugin.addAction(new ActionGoTo({ 
                                mode: ActionGoTo.MODE_NAME,
                                name: menu.getName(), 
                                to: menu.getName() 
                            }));
                        }
                    } else {
                        if(Plugins.DEBUG) {
                            console.warn(`⚠️ Menu "${menu.getName()}" del plugin "${plugin.getName()}" ha un parent "${parent}" non trovato.`);
                        }
                    }
                }
            });
        });

        return this;
    }
}

export {
    Plugin,
    Plugins,
    type PluginConfig
};