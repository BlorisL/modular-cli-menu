import { Action } from "../actions/item";
import { Menu } from "../menus/item";
import { Plugins, PluginsType } from "../plugins/collection";
import { Plugin, PluginType } from "../plugins/item";


class Modular {

    static readonly DEFAULT_MENU_NAME = 'main';
    static readonly DEFAULT_PLUGIN_NAME = 'default';

    protected plugins: Plugins;

    public constructor(items?: PluginsType) {
        this.plugins = new Plugins();
        if(items) {
            this.plugins = new Plugins(items);
        }
    }

    public getPlugins(): Plugins { return this.plugins; }

    public getPlugin(name: string): Plugin | undefined { return this.plugins.get(name); }
    public addPlugin(plugin: PluginType): this {
        this.plugins.add(plugin);
        return this;
    }

    public getMenuInPlugins(name: string): Menu | undefined {
        for(const plugin of this.plugins.toArray()) {
            const menu = plugin.getMenus().get(name);
            if(menu) {
                return menu;
            }
        }
        return undefined;
    }
    public getActionInPlugins(name: string): Action | undefined {
        for(const plugin of this.plugins.toArray()) {
            const action = plugin.getActions().get(name);
            if(action) {
                return action;
            }
        }
        return undefined;
    }

    public findMenu({ 
        pluginName = '', 
        menuName = ''
    }: { 
        pluginName: string;
        menuName: string
    }): Menu | undefined {
        let menu: Menu | undefined = undefined;

        if(pluginName === '') {
            pluginName = Modular.DEFAULT_PLUGIN_NAME;
        }
        if(menuName === '') {
            menuName = Modular.DEFAULT_MENU_NAME;
        }

        const plugin = this.getPlugin(pluginName);
        if(plugin) {
            menu = plugin.getMenus().get(menuName);
        } else {
            menu = this.getMenuInPlugins(menuName);
        }

        if(!menu) {
            menu = this.getPlugin(Modular.DEFAULT_PLUGIN_NAME)?.getMenus().get(Modular.DEFAULT_MENU_NAME);
        }

        return menu;
    }

    public findAction({
        pluginName = '',
        actionName
    }: {
        pluginName: string;
        actionName: string;
    }) {
        let action: Action | undefined = undefined;

        if(pluginName === '') {
            pluginName = Modular.DEFAULT_PLUGIN_NAME;
        }

        const plugin = this.getPlugin(pluginName);
        if(plugin) {
            action = plugin.getActions().get(actionName);
        } else {
            action = this.getActionInPlugins(actionName);
        }

        if(!action) {
            action = this.getPlugin(Modular.DEFAULT_PLUGIN_NAME)?.getActions().get(actionName);
        }

        return action;
    }

    public toObject(): PluginsType {
        return this.plugins.toObject();
    }

    public toArray(): PluginType[] {
        return this.plugins.toArray().map((plugin) => plugin.toObject());
    }

    public async print({ 
        pluginName = '', 
        menuName = ''
    }: { 
        pluginName: string;
        menuName: string
    }) {
        return await this.findMenu({ pluginName, menuName })?.print({ 
            findMenu: this.findMenu,
            findAction: this.findAction
        });
    }

    public async run({
        pluginName = '',
        actionName
    }: {
        pluginName: string;
        actionName: string;
    }) {
        return await this.findAction({ pluginName, actionName })?.run({ 
            findMenu: this.findMenu,
            findAction: this.findAction
        });
    }
}

export { 
    Modular 
};
