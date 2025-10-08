import { Action } from "../action";
import { ActionGoTo } from "../action/goto";
import { Menu } from "../menu";
import { MenuChoices } from "../menu/choices";
import { Plugin, PluginConfig } from "./plugin";

type PluginCollection = Record<string, Plugin>;

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
        const menu = this.getMenu(menuName, pluginName);
        if (menu) {
            return await menu.print({
                getGlobalActions: this.getGlobalActions.bind(this),
                findMenu: this.getMenu.bind(this),
                findAction: this.getAction.bind(this),
            });
        } else {
            return await this.getMenu('main')?.print();
        }
    }

    public async run(pluginName: string = '', actionName: string = '') {
        const action = this.getAction(actionName, pluginName);
        if (action) {
            return await action.run({
                findMenu: this.getMenu.bind(this),
                findAction: this.getAction.bind(this),
                getGlobalActions: this.getGlobalActions.bind(this),
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
                menu.getStringParents().forEach(parent => {
                    if(!menu.isParentSet(parent)) {
                        const parentMenu = this.getMenu(parent as string);
                        if (parentMenu) {
                            if(parentMenu.getMode() === MenuChoices.MODE_NAME) {
                                (parentMenu as MenuChoices).add(menu.getName());
                                plugin.addAction(new ActionGoTo({ 
                                    mode: ActionGoTo.MODE_NAME,
                                    name: menu.getName(), 
                                    to: menu.getName() 
                                }));
                            }
                            menu.addParent(parentMenu);
                        } else {
                            if(Plugins.DEBUG) {
                                console.warn(`⚠️ Menu "${menu.getName()}" del plugin "${plugin.getName()}" ha un parent "${parent}" non trovato.`);
                            }
                        }
                    }
                    menu.addParent(parent)
                });
            });
        });

        return this;
    }
}

export {
    Plugins,
}