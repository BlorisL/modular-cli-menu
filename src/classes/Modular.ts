import { Action, Actions } from "./Action";
import { Menus, Menu, MenuInput, MenuChoice } from "./Menu";
import { Plugin } from "./Plugin";
import { MenuType } from "@/types/Menu";
import { ActionType } from "@/types/Action";
import { PluginType } from "@/types/Plugin";

class Modular {
    private menus: Menus;
    private actions: Actions;

    public constructor(items: Plugin | PluginType | Array<Plugin | PluginType>) {
        this.menus = new Menus();
        this.actions = new Actions();

        this.addPlugin(items);
    }

    public addPlugin(plugins: Plugin | PluginType | Array<Plugin | PluginType>): this {
        const arr = Array.isArray(plugins) ? plugins : [plugins];
        arr.forEach(item => {
            const plugin = item instanceof Plugin ? item : new Plugin(item);
            this.addMenu(plugin.getMenus());
            this.addAction(plugin.getActions());
        });

        return this;
    }

    public getMenus(): Menus { return this.menus; }
    public addMenu(items?: Menus | Menu | MenuType | Array<Menu | MenuType>): this {
        if (items !== undefined) {
            if (items instanceof Menus) {
                items.getAll().forEach(menu => this.menus.add(menu));
            } else if (Array.isArray(items)) {
                items.forEach(item => this.addMenu(item));
            } else {
                let menu: Menu | undefined = undefined;
                if (items instanceof Menu) {
                    menu = items;
                } else {
                    // Instantiate the correct subclass based on the mode
                    if (items.mode === 'input') {
                        menu = new MenuInput(items as any);
                    } else if (items.mode === 'choice') {
                        menu = new MenuChoice(items as any);
                    }
                }
                if(menu) {
                    this.menus.add(menu);
                }
            }
        }
        return this;
    }

    public getActions(): Actions { return this.actions; }
    public addAction(items?: Actions | Action | ActionType | Array<Action | ActionType>): this {
        if (items !== undefined) {
            if (items instanceof Actions) {
                items.getAll().forEach(action => this.actions.add(action));
            } else if (Array.isArray(items)) {
                items.forEach(item => this.addAction(item));
            } else {
                const action = items instanceof Action ? items : new Action(items);
                this.actions.add(action);
            }
        }
        return this;
    }

    public async call({
        type,
        name,
        parent
    }: {
        type: 'menu' | 'action';
        name: string;
        parent?: string
    }): Promise<unknown> {
        switch (type) {
            case 'menu': 
                return await this.getMenus().get(name)?.call({
                    menus: this.getMenus(), 
                    actions: this.getActions(), 
                    parent: this.menus.getParentMenu(name)
                });
            case 'action': 
                return this.getActions().get(name)?.call({
                    menus: this.getMenus(), 
                    actions: this.getActions(), 
                    parent: this.menus.getParentMenu(name)
                });
        }
    } 
}

export { Modular };