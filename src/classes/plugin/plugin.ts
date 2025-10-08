import { Action, ActionConfig } from "../action";
import { ActionFunction, ActionFunctionConfig } from "../action/function";
import { ActionGoTo, ActionGoToConfig } from "../action/goto";
import { I18n, Language, LanguageConfig } from "../language";
import { Menu, MenuConfig } from "../menu";
import { MenuChoices, MenuChoicesConfig } from "../menu/choices";

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
        config.menus?.forEach(menuConfig => this.addMenu(menuConfig));
        config.actions?.forEach(actionConfig => this.addAction(actionConfig));
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
                if(item.plugin === undefined) {
                    item.plugin = this.getName();
                }

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
                if(item.plugin === undefined) {
                    item.plugin = this.getName();
                }
                
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

export {
    Plugin,
    type PluginConfig
};