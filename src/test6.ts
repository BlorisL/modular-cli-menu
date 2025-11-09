import { choices } from "./prompts/Choices";

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

    protected loadMenu(menu: Menu): this {
        if(menu.getType() === 'choice') {
            (menu as MenuChoice).getValues().forEach(choice => {
                if(typeof choice.getValue() === 'string') {
                    const value = choice.getValue() as string;
                    const item = this.getMenu(value) ?? this.getAction(value);
                    if(item) {
                        choice.setValue(item);
                    }
                } else {
                    const value = choice.getValue() as Menu | Action;
                    const item = this.getMenu(value.getName()) ?? this.getAction(value.getName());
                    if(item) {
                        choice.setValue(value);
                    }
                }

                if(choice.getValue() instanceof MenuChoice) {
                    (choice.getValue() as MenuChoice).addValue(
                        new ActionGoto(
                            `back_to_${menu.getName()}`,
                            menu,
                            (choice.getValue() as MenuChoice).getPlugin(),
                            true,
                        )
                    );
                } else if(choice.getValue() instanceof ActionGoto) {
                    let tmp: string | Menu | Action | undefined = (choice.getValue() as ActionGoto).getTo();
                    if(choice.getName() === 'msubmenu2') {
                        console.log('1 Adding action ', 
                            choice.getValue().getName(), 
                            ' to menu ', 
                            tmp
                        );
                    }
                    if(tmp instanceof Menu ) {
                        tmp = this.getMenu(tmp.getName());
                    } else if(tmp instanceof Action) {
                        tmp = this.getAction(tmp.getName());
                    } else {
                        tmp = this.getMenu(tmp) ?? this.getAction(tmp);
                    }

                    if(tmp) {
                        (choice.getValue() as ActionGoto).setTo(tmp); 
                    }
                    if(choice.getName() === 'msubmenu2') {
                        console.log('2 Adding action ', 
                            choice.getValue().getName(), 
                            ' to menu ', 
                            menu.getName(),
                            menu.getValues()
                        );
                    }
                }


                this.loadMenu(choice.getValue() as Menu);
            });
            //console.log(3, menu.getName(), (menu as MenuChoice).getValues().map(v => v.getName()));
        }

        return this;
    }

    protected load(plugin?: Plugin): this {
        const plugins = plugin ? [plugin] : this.getPlugins();
        plugins.forEach(p => {
            p.getMenus().forEach(menu => {
                menu.getParents().forEach(parentName => {
                    const parent = this.getMenu(parentName) ?? this.getAction(parentName);
                    if(parent) {
                        if(parent instanceof MenuChoice) {
                            parent.addValue(menu.getName());
                        }
                        //if(menu instanceof MenuChoice) {
                        //    menu.addValue(parent.getName());
                        //}
                    }
                });
            });
            p.getActions().forEach(action => {
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
        this.getPlugins().forEach(p => {
            p.getMenus().forEach(menu => {
                this.loadMenu(menu);
            });
        });
        return this;
    }
}

type PluginJson = {
    name: string;
    menus: Array<MenuChoiceJson>;
    actions: Array<ActionGotoJson | ActionFunctionJson>;
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
        let action: Action | undefined = undefined;
        switch(data.type) {
            case 'function':
                action = new ActionFunction(data as ActionFunctionJson);
                break;
            case 'goto':
                action = new ActionGoto(data as ActionGotoJson);
                break;
        }

        if(action) {
            this.actions[action.getName()] = action; 
        }
        
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

    constructor(
        nameOrData: MenuJson | Menu['name'],
        plugin?: Menu['plugin'],
        parents?: Menu['parents'][string][]
    ) {
        if (typeof nameOrData === 'string') {
            const name = nameOrData as string;
            this.name = name;
            this.plugin = plugin;
            parents?.forEach(parent => this.addParent(parent));
        } else {
            const data = nameOrData as MenuJson;
            this.name = data.name;
            this.plugin = plugin;
            data.parents?.forEach(parent => this.addParent(parent));
        }
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

    public abstract run(): Promise<unknown>;
}

type MenuChoiceValueJson = {
    name: string;
    value: string | Menu | Action;
    multi?: boolean;
};

class MenuChoiceValue {
    public name: MenuChoiceValueJson['name'];
    public value: MenuChoiceValueJson['value'];
    public multi: Exclude<MenuChoiceValueJson['multi'], undefined>;

    constructor(name: string, value?: MenuChoiceValueJson['value'], multi?: boolean) {
        this.name = name;
        this.value = value ?? name;
        this.multi = multi ?? false;
    }

    public getName(): MenuChoiceValue['name'] { return this.name; }

    public getValue(): MenuChoiceValue['value'] { return this.value; }
    public setValue(value: MenuChoiceValue['value']): this { 
        //this.value = value; 
        if(value instanceof MenuChoice) {
            this.value = new MenuChoice(
                value.getName(), 
                value.getValues(), 
                value.getPlugin(), 
                value.getParents()
            );
        } else if(value instanceof ActionFunction) {
            this.value = new ActionFunction(
                value.getName(), 
                value.getCallback(), 
                value.getPlugin(), 
                value.isGlobal(), 
                value.getParents()
            );
        } else if(value instanceof ActionGoto) {
            this.value = new ActionGoto(
                value.getName(), 
                value.getTo(), 
                value.getPlugin(), 
                value.isGlobal(), 
                value.getParents()
            );
        } else {
            this.value = value;
        }
        return this; 
    }

    public isMulti(): MenuChoiceValue['multi'] { return this.multi === true; }

    public toJson(): MenuChoiceValueJson {
        return {
            name: this.name,
            value: typeof this.value === 'string' ? this.value : this.value.getName(),
            multi: this.multi
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

    constructor(
        nameOrData: MenuChoiceJson | MenuChoice['name'],
        values?: MenuChoice['values'][string][],
        plugin?: MenuChoice['plugin'],
        parents?: MenuChoice['parents'][string][]
    ) {
        super(nameOrData, plugin, parents);
        if (typeof nameOrData === 'string') {
            this.type = 'choice';
            values?.forEach(value => this.addValue(value));
        } else {
            const data = nameOrData as MenuChoiceJson;
            this.type = data.type;
            data.values.forEach(value => this.addValue(value));
        }
    }

    public getValues(): MenuChoice['values'][string][] {
        return Object.values(this.values);
    }
    public getValue(name: string): MenuChoiceValue | undefined { 
        return this.values[name];
    }
    public addValue(data: MenuChoiceJson['values'][number] | Menu | Action): this {
        let tmpValue: MenuChoiceValue;
        if(data instanceof Menu || data instanceof Action) {
            tmpValue = new MenuChoiceValue(data.getName(), data);
        } else if(typeof data === 'string') {
            tmpValue = new MenuChoiceValue(data);
        } else {
            tmpValue = new MenuChoiceValue(data.name, data.value, data.multi);
        }

        if(!this.getValue(tmpValue.getName())) {
            this.values[tmpValue.getName()] = tmpValue;
        }
        return this;
    }

    public override toJson(): MenuChoiceJson {
        return {
            ...super.toJson(),
            type: this.type,
            values: this.getValues().map(v => v.toJson())
        };
    }

    public async run(): Promise<unknown> {
        const answers = await choices({
            message: `Select an action from menu "${this.getName()}"`,
            choices: this.getValues().map(item => {
                return {
                    name: item.getName(),
                    value: (typeof item.getValue() === 'string') 
                        ? item.getValue() as string 
                        : (item.getValue() as Menu | Action).getName(),
                    multi: item.isMulti(),
                };
            }),
        }) as string[];

        answers.forEach(answer => {
            console.log(answer)
            const item = this.getValue(answer);

            if(item && typeof item.getValue() !== 'string') {
                (item.getValue() as Menu | Action).run();
            }
        });

        return this;
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

    constructor(
        nameOrData: ActionJson | Action['name'],
        plugin?: Action['plugin'],
        global?: Action['global'],
        parents?: Action['parents'][string][]
    ) {
        if (typeof nameOrData === 'string') {
            const name = nameOrData as string;
            this.name = name;
            this.plugin = plugin;
            this.global = global ?? false;
            parents?.forEach(parent => this.addParent(parent));
        } else {
            const data = nameOrData as ActionJson;
            this.name = data.name;
            this.plugin = data.plugin;
            this.global = data.global ?? false;
            data.parents?.forEach(parent => this.addParent(parent));
        }
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

    public abstract run(): Promise<unknown>;
}

type ActionFunctionJson = ActionJson & {
    type: 'function';
    callback: () => Promise<void>;
};

class ActionFunction extends Action {
    protected type: ActionFunctionJson['type'] = 'function';
    protected callback: ActionFunctionJson['callback'];

    constructor(
        nameOrData: ActionFunctionJson | ActionFunction['name'],
        callback?: ActionFunction['callback'],
        plugin?: ActionFunction['plugin'],
        global?: ActionFunction['global'],
        parents?: ActionFunction['parents'][string][]
    ) {
        super(nameOrData, plugin, global, parents);
        if (typeof nameOrData === 'string') {
            this.callback = callback!;
        } else {
            const data = nameOrData as ActionFunctionJson;
            this.callback = data.callback;
        }
    }
    
    public getCallback(): ActionFunction['callback'] { return this.callback; }

    public override toJson(): ActionFunctionJson {
        return {
            ...super.toJson(),
            type: this.type,
            callback: this.getCallback(),
        };
    }

    public async run(): Promise<unknown> {
        return await this.callback();
    }
}

type ActionGotoJson = ActionJson & {
    type: 'goto';
    to: string;
};

class ActionGoto extends Action {
    protected type: ActionGotoJson['type'] = 'goto';
    protected to: string | Menu | Action;

    constructor(
        nameOrData: ActionGotoJson | ActionGoto['name'],
        to?: ActionGoto['to'],
        plugin?: ActionGoto['plugin'],
        global?: ActionGoto['global'],
        parents?: ActionGoto['parents'][string][]
    ) {
        super(nameOrData, plugin, global, parents);
        if (typeof nameOrData === 'string') {
            this.to = to!;
        } else {
            const data = nameOrData as ActionGotoJson;
            this.to = data.to;
        }
    }
    
    public getTo(): ActionGoto['to'] { return this.to; }
    public setTo(to: ActionGoto['to']): this { 
        this.to = to; 
        return this; 
    }

    public override toJson(): ActionGotoJson {
        return {
            ...super.toJson(),
            type: this.type,
            to: typeof this.getTo() === 'string' ? this.getTo() as string : (this.getTo() as Menu | Action).getName(),
        };
    }

    public async run(): Promise<unknown> {
        console.log(`Navigating to "${typeof this.to === 'string' ? this.to : this.to.getName()}"...`, typeof this.to === 'string');
        if(typeof this.to !== 'string') {
            return await this.to.run();
        }
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
            //{
            //    name: "back",
            //    type: "goto",
            //    global: true
            //},
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
                parents: [ "submenu2" ],
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
                parents: ["main"]
            }
        ]
    }
]);

plugins.getMenu('main').run();
//console.log(0, plugins.getMenu('main'));
//console.log(0, (plugins.getMenu('main') as MenuChoice).getValue('submenu1').getValue());
//console.log(0, plugins.getMenu('submenu2'));