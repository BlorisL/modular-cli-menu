import { I18n, Language, LanguageConfig } from "../language";
import { Menu, MenuConfig } from "../menu";
import { MenuChoices, MenuChoicesConfig } from "../menu/choices";

type PluginCollection = Record<string, Plugin>;
type MenuCollection = Record<string, Menu>;

type PluginConfig = {
    name: string;
    menus?: Array<MenuChoicesConfig>;
    translations?: LanguageConfig[];
}

class Plugin {
    protected name: string;
    protected menus: MenuCollection = {};
    protected i18n: I18n = new I18n();

    public constructor(config: PluginConfig) {
        this.name = config.name;
        config.menus?.forEach(menuConfig => {
            let menu: Menu | undefined = undefined;
            switch(menuConfig.mode) {
                case MenuChoices.MODE_NAME:
                    menu = new MenuChoices(menuConfig);
                    break;
                //case 'input':
                //default:
                //    //menu = new InputMenu({ ...menuConfig, plugin: this });
                //    menu = new Menu(menuConfig);
                //    break;
            }
            if(menu) {
                this.menus[menu.getName()] = menu;
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

    public getMenu(pluginName: string = '', menuName: string = ''): Menu | undefined {
        let menu = this.get(pluginName)?.getMenu(menuName);
        if(!menu) {
            menu = this.get('default')?.getMenu('main');
        }
        return menu;
    }

    protected checkParents(): this {
        this.getAll().forEach(plugin => {
            plugin.getMenus().forEach(menu => {
                const parent = menu.getParent();
                if(parent && typeof parent === 'string') {
                    const parentMenu = plugin.getMenu(parent);
                    if (parentMenu) {
                        menu.setParent(parentMenu);
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