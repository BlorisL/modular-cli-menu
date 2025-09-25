import { Action } from "../actions/item";
import { Menu } from "../menus/item";
import { Plugins, PluginsType } from "../plugins/collection";
import { Plugin, PluginType } from "../plugins/item";


class MenuNavigator<TMenu extends Menu = Menu, TAction extends Action = Action> {
    private menuStack: TMenu[] = [];
    private currentMenu: TMenu | null = null;

    public constructor(private modular: Modular) {}

    public getCurrentMenu(): TMenu | null {
        return this.currentMenu;
    }

    public getMenuStack(): TMenu[] {
        return [...this.menuStack];
    }

    public async navigateTo(menu: TMenu): Promise<void> {
        if (this.currentMenu) {
            this.menuStack.push(this.currentMenu);
        }
        this.currentMenu = menu;
        await this.printCurrentMenu();
    }

    public async goBack(): Promise<void> {
        if (this.menuStack.length > 0) {
            this.currentMenu = this.menuStack.pop()!;
            await this.printCurrentMenu();
        } else {
            // Forse chiudere o qualcosa
            console.log("No previous menu");
        }
    }

    private async printCurrentMenu(): Promise<void> {
        if (this.currentMenu) {
            await this.currentMenu.print({
                findMenu: this.modular.findMenu.bind(this.modular),
                findAction: this.modular.findAction.bind(this.modular)
            });
        }
    }

    public async runAction(action: TAction): Promise<unknown> {
        return await action.run({
            findMenu: this.modular.findMenu.bind(this.modular),
            findAction: this.modular.findAction.bind(this.modular)
        });
    }
}

class Modular {

    static readonly DEFAULT_MENU_NAME = 'main';
    static readonly DEFAULT_PLUGIN_NAME = 'default';

    protected plugins: Plugins;
    protected navigator: MenuNavigator;

    public constructor(items?: PluginsType) {
        this.plugins = new Plugins();
        if(items) {
            this.plugins = new Plugins(items);
        }
        this.navigator = new MenuNavigator(this);
    }

    public getNavigator(): MenuNavigator {
        return this.navigator;
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
    Modular,
    MenuNavigator
};
