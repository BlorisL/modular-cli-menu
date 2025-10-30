import { Menu } from "./classes/menu";

class Plugins {
    protected plugins: Record<string, Plugin> = {};
    protected main: Menu;

    constructor(plugins: Plugin[]) {
        plugins.forEach(plugin => this.addPlugin(plugin));
    }

    public getPlugins(): Plugin[] { return Object.values(this.plugins); }
    public getPlugin(name: string): Plugin | undefined { return this.plugins[name]; }
    public addPlugin(plugin: Plugin): this {
        this.plugins[plugin.getName()] = new Plugin(
            plugin.getName(), 
            plugin.getMenus().map(menu => menu.setParents()), 
            plugin.getActions().map(menu => menu.setParents()),
        );
        return this;
    }
}

class Plugin {
    protected name: string;
    protected menus: Record<string, Menu> = {};
    protected actions: Record<string, Action> = {};

    constructor(name: string, menus: Menu[] = [], actions: Action[] = []) {
        this.name = name;
    }

    public getName(): string { return this.name; }

    public getMenus(): Menu[] { return Object.values(this.menus); }
    public getMenu(name: string): Menu | undefined { return this.menus[name]; }
    public addMenu(menu: string | Menu): this {
        if (typeof menu === 'string') {
            this.menus[menu] = new Menu(menu);
        } else {
            this.menus[menu.getName()] = new Menu(menu.getName());
        }
        return this;
    }

    public getActions(): Action[] { return Object.values(this.actions); }
    public getAction(name: string): Action | undefined { return this.actions[name]; }
    public addAction(action: string | Action): this {
        if (typeof action === 'string') {
            this.actions[action] = new Action(action);
        } else {
            this.actions[action.getName()] = new Action(action.getName());
        }
        return this;
    }
}

abstract class Item {
    protected name: string;
    protected parents: Record<string, string | Item> = {};

    constructor(name: string, parents: Item['parents'] = {}) {
        this.name = name;
        this.parents = parents;
    }

    public getName(): string { return this.name; }

    public getParents(): Item['parents'][string][] { return Object.values(this.parents); }
    public setParents(parents: Item['parents'] = {}): this { this.parents = parents; return this; }
    public addParent(parent: string | Item): this {
        if (typeof parent === 'string') {
            this.parents[parent] = parent;
        } else {
            this.parents[parent.getName()] = parent;
        }
        return this;
    }
}

class Menu extends Item {
    constructor(name: string, parents: Menu['parents'] = {}) {
        super(name, parents);
    }
}

class Action extends Item {
    constructor(name: string, parents: Action['parents'] = {}) {
        super(name, parents);
    }

    public getName(): string { return this.name; }
}

const plugins = new Plugins([
    {
        name: "default",
        menus: [
            {
                name: "main",
                type: "select",
                values: [
                    "action1",
                    //"action2",
                ],
                parents: []
            }
        ],
        actions: [
            {
                name: "back",
                type: "goto",
                global: true
            },
            {
                name: "exit",
                type: "function",
                global: true,
                callback: async () => { 
                    console.log('Exiting...'); 
                    process.exit(0); 
                }
            },
            {
                name: "action1",
                type: "function",
                callback: async () => { console.log('Action 1 executed'); }
            },
            //{
            //    name: "action2",
            //    type: "function",
            //    callback: async () => { console.log('Action 2 executed'); }
            //}
        ]
    },
    {
        name: "example",
        menus: [
            {
                name: "submenu1",
                type: "select",
                values: [
                    "subaction1",
                    "subaction2",
                ],
                parents: [
                    "main"
                ]
            },
            {
                name: "submenu2",
                type: "select",
                values: [
                    "subaction3",
                    "subaction4",
                ],
                parents: [
                    "submenu1"
                ]
            }
        ],
        actions: [
            {
                name: "subaction1",
                type: "function",
                callback: async () => { console.log('SubAction 1 executed'); }
            },
            {
                name: "subaction2",
                type: "function",
                callback: async () => { console.log('SubAction 2 executed'); }
            },
            {
                name: "subaction3",
                type: "function",
                callback: async () => { console.log('SubAction 3 executed'); }
            },
            {
                name: "subaction4",
                type: "function",
                callback: async () => { console.log('SubAction 4 executed'); }
            }
        ]
    },
    {
        name: "exmaple2",
        menus: [],
        actions: [
            {
                name: "action2",
                type: "function",
                parents: [ "main" ],
                callback: async () => { console.log('Action 2 executed'); }
            },
            {
                name: "msubmenu2",
                type: "goto",
                to: "submenu2",
                from: "main"
            }
        ]
    }
]);