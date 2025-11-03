class Plugins {
    protected items: Record<string, Plugin> = {};
    protected main?: Menu;

    constructor(data: PluginJson[]) {
        data.forEach(plugin => this.addPlugin(plugin));
        //this.main = this.getPlugin('default')?.getMenu('main');
    }

    public getPlugins(): Plugins['items'][string][] { return Object.values(this.items); }
    public getPlugin(name: string): Plugins['items'][string] | undefined { 
        return this.items[name]; 
    }
    public addPlugin(data: PluginJson): this { 
        this.items[data.name] = new Plugin(data); 
        this.load(this.items[data.name]);
        return this; 
    }

    public getMenu(name: string, plugin?: string): Menu | undefined {
        let menu: Menu | undefined = undefined;
        if(plugin) {
            menu = this.getPlugin(plugin)?.getMenu(name);
        } else {
            this.getPlugins().forEach(p => {
                const m = p.getMenu(name);
                if(m) {
                    menu = m;
                }
            })
        }
        return menu;
    }

    public getAction(name: string, plugin?: string): Action | undefined {
        let action: Action | undefined = undefined;
        if(plugin) {
            action = this.getPlugin(plugin)?.getAction(name);
        } else {
            this.getPlugins().forEach(p => {
                const a = p.getAction(name);
                if(a) {
                    action = a;
                }
            })
        }
        return action;
    }

    protected load(plugin?: Plugin): this {
        const plugins = plugin ? [plugin] : this.getPlugins();
        plugins.forEach(plugin => {
            plugin.getMenus().forEach(menu => {
                menu.getParents().forEach(parentName => {
                    const parent = this.getMenu(parentName) ?? this.getAction(parentName);
                    if(parent) {
                        if(parent instanceof MenuChoice) {
                            parent.addValue(menu.getName());
                        }
                    }
                });
            });
            plugin.getActions().forEach(action => {
                action.getParents().forEach(parentName => {
                    const parent = this.getMenu(parentName) ?? this.getAction(parentName);
                    if(parent) {
                        if(parent instanceof MenuChoice) {
                            parent.addValue(action.getName());
                        }
                    }
                });
            });
        });
        return this;
    }
}

type PluginJson = {
    name: string;
    menus: MenuJson[];
    actions: ActionJson[];
};

class Plugin {
    protected name: PluginJson['name'];
    protected menus: Record<string, Menu> = {};
    protected actions: Record<string, Action> = {};

    constructor(data: PluginJson) {
        this.name = data.name;
        data.menus.forEach(menu => this.addMenu(menu));
        data.actions.forEach(action => this.addAction(action));
    }

    public getName(): Plugin['name'] { return this.name; }

    public getMenus(): Plugin['menus'][string][] { return Object.values(this.menus); }
    public getMenu(name: string): Plugin['menus'][string] | undefined { 
        //console.log(1, name, this.getMenus().map(m => m.getName()));
        return this.menus[name]; 
    }
    public addMenu(data: MenuJson): this { 
        let menu: Menu | undefined = undefined;
        switch(data.type) {
            case 'choice':
                menu = new MenuChoice(data as MenuChoiceJson);
                break;
            case 'input':
                //menu = new Menu(data);
                break;
        }

        if(menu) {
            this.menus[menu.getName()] = menu; 
        }
        
        return this; 
    }

    public getActions(): Plugin['actions'][string][] { return Object.values(this.actions); }
    public getAction(name: string): Plugin['actions'][string] | undefined { 
        return this.actions[name]; 
    }
    public addAction(data: ActionJson): this { 
        this.actions[data.name] = new Action(data); 
        return this; 
    }
}

type MenuJson = {
    name: string;
    type: 'choice' | 'input';
    plugin?: string;
    parents?: string[]
}

abstract class Menu {
    protected name: MenuJson['name'];
    protected abstract type: MenuJson['type'];
    protected plugin?: MenuJson['plugin'];
    protected parents: Record<string, Exclude<MenuJson['parents'], undefined>[number]> = {};

    constructor(data: MenuJson) {
        this.name = data.name;
        this.plugin = data.plugin;
        data.parents?.forEach(parent => this.addParent(parent));
    }

    public getName(): Menu['name'] { return this.name; }
    
    public getPlugin(): Menu['plugin'] { return this.plugin; }

    public getType(): MenuJson['type'] { return this.type; }

    public getParents(): Menu['parents'][string][] { return Object.values(this.parents); }
    public getParent(name: string): Menu['parents'][string] | undefined { 
        return this.parents[name]; 
    }
    public addParent(parent: Menu['parents'][string]): this {
        const item = this.getParent(parent);
        if(!item) {
            this.parents[parent] = parent;
        }
        return this;
    }

    public toJson(): MenuJson {
        return {
            name: this.name,
            type: this.type,
            plugin: this.plugin,
            parents: this.getParents()
        };
    }
}

type MenuChoiceValueJson = {
    name: string;
    value: string;
    isMulti?: boolean;
};

class MenuChoiceValue {
    public name: MenuChoiceValueJson['name'];
    public value: MenuChoiceValueJson['value'];
    public isMulti: MenuChoiceValueJson['isMulti'];

    constructor(name: string, value?: string, isMulti?: boolean) {
        this.name = name;
        this.value = value ?? name;
        this.isMulti = isMulti ?? false;
    }

    public getName(): string { return this.name; }
    public getValue(): string { return this.value; }
    public issMulti(): boolean { return this.isMulti === true; }

    public toJson(): MenuChoiceValueJson {
        return {
            name: this.name,
            value: this.value,
            isMulti: this.isMulti
        };
    }
}

type MenuChoiceJson = MenuJson & {
    type: 'choice';
    values: Array<string | MenuChoiceValueJson>;
};

class MenuChoice extends Menu {
    protected type: MenuChoiceJson['type'] = 'choice';
    protected values: Record<string, MenuChoiceValue> = {};

    constructor(data: MenuChoiceJson) {
        super(data);
        this.type = data.type;
        data.values.forEach(value => this.addValue(value));
    }

    public getValues(): MenuChoice['values'][string][] {
        return Object.values(this.values);
    }
    public getValue(name: string): MenuChoiceValue | undefined { 
        return this.values[name];
    }
    public addValue(data: MenuChoiceJson['values'][number]): this {
        const tmpValue = typeof data === 'string'
            ? new MenuChoiceValue(data)
            : new MenuChoiceValue(data.name, data.value, data.isMulti)
        ;
        if(!this.getValue(tmpValue.getName())) {
            this.values[tmpValue.getName()] = tmpValue;
        }
        return this;
    }

    public override toJson() {
        return {
            ...super.toJson(),
            values: this.getValues().map(v => v.toJson())
        };
    }
}

type ActionJson = {
    name: string;
    type: 'function' | 'goto';
    plugin?: string;
    parents?: string[];
    global?: boolean;
};

abstract class Action {
    protected name: ActionJson['name'];
    protected abstract type: ActionJson['type'];
    protected plugin?: ActionJson['plugin'];
    protected parents: Record<string, Exclude<ActionJson['parents'], undefined>[number]> = {};
    protected global: ActionJson['global'];

    constructor(data: ActionJson) {
        this.name = data.name;
        this.plugin = data.plugin;
        this.global = data.global ?? false;
        data.parents?.forEach(parent => this.addParent(parent));
    }

    public getName(): Action['name'] { return this.name; }

    public getType(): ActionJson['type'] { return this.type; }
    
    public getPlugin(): Action['plugin'] { return this.plugin; }

    public getParents(): Action['parents'][string][] { return Object.values(this.parents); }
    public getParent(name: string): Action['parents'][string] | undefined { 
        return this.parents[name]; 
    }
    public addParent(parent: Action['parents'][string]): this {
        const item = this.getParent(parent);
        if(!item) {
            this.parents[parent] = parent;
        }
        return this;
    }

    public isGlobal(): Action['global'] { return this.global; }

    public toJson(): ActionJson {
        return {
            name: this.name,
            type: this.type,
            plugin: this.plugin,
            parents: this.getParents(),
            global: this.global
        };
    }
}

type ActionFunctionJson = ActionJson & {
    type: 'function';
    callback: () => Promise<void>;
};

class ActionFunction extends Action {
    protected type: ActionFunctionJson['type'] = 'function';
    protected callback: () => Promise<void>;

    constructor(data: ActionFunctionJson) {
        super(data);
        this.type = data.type;
        this.callback = data.callback;
    }
    
    public getCallback(): ActionFunction['callback'] { return this.callback; }

    public override toJson() {
        return {
            ...super.toJson(),
            callback: this.getCallback(),
        };
    }
}

type ActionGotoJson = ActionJson & {
    type: 'goto';
    to: string;
};

class ActionGoto extends Action {
    protected type: ActionGotoJson['type'] = 'goto';
    protected to: string;

    constructor(data: ActionGotoJson) {
        super(data);
        this.type = data.type;
        this.to = data.to;
    }
    
    public getTo(): ActionGoto['to'] { return this.to; }

    public override toJson() {
        return {
            ...super.toJson(),
            to: this.getTo(),
        };
    }
}

const plugins = new Plugins([
    {
        name: "default",
        menus: [
            {
                name: "main",
                type: "choice",
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
                type: "choice",
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
                type: "choice",
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

console.log(0, plugins.getMenu('main'));
//console.log(0, plugins.getMenu('submenu2'));
//console.log(0, plugins.getMenu('submenu1'));