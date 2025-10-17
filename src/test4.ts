import { Choice, choices } from "@/prompts/Choices";

/**
 * Deep-clone helper that avoids infinite recursion on cyclic graphs.
 * Uses a WeakMap to keep track of already-cloned objects.
 * Accepts Menu, Action or string and returns a cloned equivalent.
 */
function cloneDeep(item: any, map = new WeakMap<any, any>()): any {
    if (typeof item === 'string') return item;
    if (map.has(item)) return map.get(item);

    // Menu
    if (item instanceof Menu) {
        // Create a placeholder and register it to handle cycles.
        const placeholder = new Menu(item.getName(), [], []);
        map.set(item, placeholder);

        // Clone values (can be strings, Menu or Action)
        const clonedValues = item.getValues().map((v: any) => cloneDeep(v, map));
        const vals = placeholder.getValues();
        clonedValues.forEach((cv: any) => {
            if (typeof cv === 'string') {
                vals.push(cv);
            } else {
                // addValue expects Menu | Action
                placeholder.addValue(cv);
            }
        });

        // Clone parents (can be strings, Menu or Action)
        const clonedParents = item.getParents().map((p: any) => cloneDeep(p, map));
        const pars = placeholder.getParents();
        clonedParents.forEach((cp: any) => {
            if (typeof cp === 'string') {
                pars.push(cp);
            } else {
                placeholder.addParent(cp);
            }
        });

        return placeholder;
    }

    // ActionGoTo: construct manually so we can set to/from with cloneDeep
    if (item instanceof ActionGoTo) {
        const orig = item as ActionGoTo;
        const a = new ActionGoTo(orig.getName(), orig.getGlobal());
        map.set(item, a);
        if (orig.isTo()) {
            a.setTo(cloneDeep(orig.getTo(), map));
        }
        if (orig.isFrom()) {
            a.setFrom(cloneDeep(orig.getFrom(), map));
        }
        return a;
    }

    // Other Actions: rely on their own clone implementations (safe for functions etc.)
    if (item instanceof Action) {
        const cloned = item.clone();
        map.set(item, cloned);
        return cloned;
    }

    // Fallback: return as-is
    return item;
}

type PluginJson = {
    name: string;
    menus?: MenuJson[];
    actions?: ActionsJson[];
};

type PluginObject = {
    name: string;
    menus: Record<string, Menu>;
    actions: Record<string, ActionsClass>;
};

class Plugin {
    protected name: PluginObject['name'];
    protected menus: PluginObject['menus'];
    protected actions: PluginObject['actions'];

    constructor(params: PluginJson);
    constructor(
        name: string,
        menus?: Menu[],
        actions?: Action[]
    );

    constructor(
        nameOrParams: PluginJson | string,
        menus: Menu[] = [],
        actions: ActionsClass[] = []
    ) {
        if (typeof nameOrParams === 'string') {
            const name = nameOrParams as string;
            this.name = name;
            this.menus = {};
            this.actions = {};

            menus.forEach(menu => this.addMenu(menu));
            actions.forEach(action => this.addAction(action));
        } else {
            const params = nameOrParams as PluginJson;
            this.name = params.name;
            this.menus = {};
            this.actions = {};

            (params.menus ?? []).forEach(menu => this.addMenu(menu));
            (params.actions ?? []).forEach(action => this.addAction(action));
        }
    }

    /*public constructor(name: string, menus: Menu[] = [], actions: Action[] = []) {
        this.name = name;
        this.menus = {};
        this.actions = {};

        menus.forEach(menu => this.addMenu(menu));
        actions.forEach(action => this.addAction(action));
    }*/

    public getName(): string { return this.name; }


    public getMenus(): Menu[] { return Object.values(this.menus); }
    public getMenu(name: string): Menu | undefined { return this.menus[name]; }
    //public addMenu(menu: Menu): this { this.menus[menu.getName()] = menu; return this; }
    public addMenu(menu: MenuJson | Menu): this {
        const m = menu instanceof Menu ? menu : new Menu(menu);
        this.menus[m.getName()] = m;
        return this;
    }

    public getActions(): ActionsClass[] { return Object.values(this.actions); }
    public getAction(name: string): ActionsClass | undefined { return this.actions[name]; }
    //public addAction(action: Action): this { this.actions[action.getName()] = action; return this; }
    public addAction(action: ActionsJson | ActionsClass): this {
        let a: ActionsClass | undefined = undefined;
        if (action instanceof Action) {
            a = action;
        } else {
            switch (action.type) {
                case 'goto': a = new ActionGoTo(action as ActionGotoJson); break;
                case 'function': a = new ActionFunction(action as ActionFunctionJson); break;
            }
        }

        if(a) {
            this.actions[a.getName()] = a;
        }

        return this;
    }

    public getGlobalActions(): Action[] {
        return this.getActions().filter(action => action.isGlobal());
    }

    public getGoToAction(name: string): ActionGoTo | undefined {
        const action = this.getAction(name);
        return action instanceof ActionGoTo ? action : undefined;
    }

    public getFunctionAction(name: string): ActionFunction | undefined {
        const action = this.getAction(name);
        return action instanceof ActionFunction ? action : undefined;
    }

    public toJson(): PluginJson {
        return {
            name: this.getName(),
            menus: this.getMenus().map(m => m.toJson()),
            actions: this.getActions().map(a => a.toJson()),
        };
    }
}

type PluginsJson = PluginJson[];
type PluginsObject = {
    items: Record<string, Plugin>;
};

class Plugins {
    protected items: PluginsObject['items'] = {};

    constructor(params: PluginsJson);
    constructor(plugins: Plugin[]);

    constructor(
        pluginsOrParams: PluginsJson | Plugin[] = []
    ) {
        pluginsOrParams.forEach(plugin => this.add(plugin));
    }

    public getAll(): Plugin[] { return Object.values(this.items); }

    public get(name: string): Plugin | undefined { return this.items[name]; }
    public add(plugin: PluginJson | Plugin): this {
        const p = plugin instanceof Plugin ? plugin : new Plugin(plugin);
        this.items[p.getName()] = p;
        this.checkEntities();
        return this;
    }

    public getMenus(): Menu[] { return this.getAll().flatMap(plugin => plugin.getMenus()); }
    public findMenu(menuName: string = '', pluginName: string = ''): Menu | undefined {
        let menu: Menu | undefined = this.getMenu(menuName, pluginName);

        if (!menu) {
            menu = this.get('default')?.getMenu('main');
        }

        return menu;
    }
    public getMenu(menuName: string = '', pluginName: string = ''): Menu | undefined {
        let menu: Menu | undefined = undefined;
        const plugin = this.get(pluginName);

        if (plugin) {
            menu = plugin.getMenu(menuName);
        } else {
            this.getAll().some(p => {
                menu = p.getMenu(menuName);
                return !!menu;
            });
        }

        return menu;
    }

    public getActions(): Action[] { return this.getAll().flatMap(plugin => plugin.getActions()); }
    public getAction(actionName: string = '', pluginName: string = ''): Action | undefined {
        let action: Action | undefined = undefined;
        const plugin = this.get(pluginName);

        if (plugin) {
            action = plugin.getAction(actionName);
        } else {
            this.getAll().some(p => {
                action = p.getAction(actionName);
                return !!action;
            });
        }

        return action;
    }

    public getGlobalActions(): Action[] {
        let actions: Action[] = [];

        this.getAll().forEach(plugin => {
            actions = actions.concat(plugin.getGlobalActions());
        });

        return actions;
    }

    public getGoToAction(actionName: string, pluginName: string = ''): ActionGoTo | undefined {
        const action = this.getAction(actionName, pluginName);
        return action instanceof ActionGoTo ? action : undefined;
    }

    public getFunctionAction(actionName: string, pluginName: string = ''): ActionFunction | undefined {
        const action = this.getAction(actionName, pluginName);
        return action instanceof ActionFunction ? action : undefined;
    }

    public toJson(): PluginsJson {
        return this.getAll().map(p => p.toJson());
    }

    protected checkEntities(): void {
        const back = this.getGoToAction('back')!;

        this.getMenus().forEach(menu => {
            menu.getValues().forEach(value => {
                if (typeof value === 'string') {
                    const item = this.getMenu(value) ?? this.getAction(value);
                    if (item) {
                        menu.addValue(item);
                        if (item instanceof Menu) {
                            console.log('add', menu.getName(), 'to', item.getName());
                            if (menu.getName() !== item.getName()) {
                                menu.addValue(back.clone().setFrom(item));
                            }
                        }
                    }
                }
            });
            menu.getParents().forEach((parent, index) => {
                if (typeof parent === 'string') {
                    const item = this.getMenu(parent) ?? this.getAction(parent);
                    if (item) {
                        menu.addParent(item);
                        if (item instanceof Menu) {
                            item.addValue(menu);
                            if (menu.getName() !== item.getName()) {
                                console.log(menu.getName(), 'add back to', item.getName());
                                menu.addValue(back.clone().setFrom(item));
                            }
                        }
                    }
                }
            });
        });
        this.getActions().forEach(action => {
            if(!action.isGlobal()) {
                if (action instanceof ActionGoTo) {
                    if (action.isFromString()) {
                        const item = this.getMenu(action.getFrom() as string) ?? this.getAction(action.getFrom() as string);
                        if (item) {
                            action.setFrom(item);
                            if (item instanceof Menu) {
                                item.addValue(action);
                            }
                        }
                    }
                    if (action.isToString()) {
                        const item = (this.getMenu(action.getTo() as string) ?? this.getAction(action.getTo() as string))?.clone();
                        if (item) {
                            if (item instanceof Menu && action.getFrom() instanceof Menu) {
                                const menu = action.getFrom() as Menu;
                                if (item.getName() !== menu.getName()) {
                                    item.addValue(back.clone().setFrom(menu));
                                }
                            }
                            action.setTo(item);
                        }
                    }
                }
            }
        });
        this.getGlobalActions().forEach(action => {
            if(action.getName() !== 'back') {
                this.getAll().forEach(plugin => {
                    plugin.getMenus().forEach(menu => {
                        menu.addValue(action.clone());
                    });
                });
            }
        });
        this.getMenus().forEach(menu => {
            menu.getValues().sort((a, b) => {
                const aIsGlobal = a instanceof Action && a.isGlobal();
                const bIsGlobal = b instanceof Action && b.isGlobal();

                if (aIsGlobal && !bIsGlobal) return 1;
                if (!aIsGlobal && bIsGlobal) return -1;
                
                return 0;
            });
        });
    }
}

type MenuJson = {
    name: string;
    values?: Array<string>;
    parents?: Array<string>;
};
type MenuValueObject = Menu | Action | string;
type MenuParentObject = Menu | Action | string;
type MenuObject = {
    name: string;
    values: MenuValueObject[];
    parents: MenuParentObject[];
};

class Menu {
    protected name: MenuObject['name'];
    protected values: MenuObject['values'];
    protected parents: MenuObject['parents'];

    constructor(params: MenuJson);
    constructor(
        name: string,
        values?: Array<Menu | Action | string>,
        parents?: Array<Menu | Action | string>
    );

    constructor(
        nameOrParams: MenuJson | MenuObject['name'],
        values?: MenuObject['values'],
        parents?: MenuObject['parents']
    ) {
        if (typeof nameOrParams === 'string') {
            const name = nameOrParams as string;
            this.name = name;
            this.values = values ?? [];
            this.parents = parents ?? [];
        } else {
            const params = nameOrParams as MenuJson;
            this.name = params.name;
            this.values = (params.values ?? []) as MenuObject['values'];
            this.parents = (params.parents ?? []) as MenuObject['parents'];
        }
    }

    public getName(): string { return this.name; }

    public getValues(): MenuObject['values'] { return this.values; }
    public getValue(name: string): MenuValueObject | undefined {
        return this.values.find(v => {
            if (typeof v === 'string') {
                return v === name ? v : undefined;
            } else {
                return v.getName() === name ? v : undefined;
            }
        });
    }
    public addValues(values: Exclude<MenuValueObject, string>[]): this {
        values.forEach(value => this.addValue(value));
        return this;
    }
    public addValue(value: Exclude<MenuValueObject, string>): this {
        if (this.getValue(value.getName())) {
            const index = this.values.findIndex(
                v => (typeof v === 'string' ? v : v.getName()) === value.getName()
            );
            if (index !== -1) {
                this.values.splice(index, 1, value);
            }
        } else {
            this.values.push(value);
        }

        return this;
    }

    public getParents(): MenuObject['parents'] { return this.parents; }
    public getParent(name: string): MenuParentObject | undefined {
        return this.parents.find(v => {
            if (typeof v === 'string') {
                return v === name ? v : undefined;
            } else {
                return v.getName() === name ? v : undefined;
            }
        });
    }
    public addParent(parent: Exclude<MenuParentObject, string>): this {
        if (this.getParent(parent.getName())) {
            const index = this.parents.findIndex(
                v => (typeof v === 'string' ? v : v.getName()) === parent.getName()
            );
            if (index !== -1) {
                this.parents.splice(index, 1, parent);
            }
        } else {
            this.parents.push(parent);
        }

        return this;
    }

    public toJson(): MenuJson {
        return {
            name: this.getName(),
            values: this.getValues().map(v => typeof v === 'string' ? v : v.getName()),
            parents: this.getParents().map(p => typeof p === 'string' ? p : p.getName())
        };
    }

    public clone(): Menu {
        return new Menu(
            this.getName(),
            this.getValues().map(v => typeof v === 'string' ? v : v.clone())
        );
    }

    public async print(): Promise<unknown> {
        const answers = await choices({
            message: `Select an action from menu "${this.getName()}"`,
            choices: this.getValues().map(v => {
                const name = typeof v === 'string' ? v : v.getName();
                const value = typeof v === 'string' ? v : v.getName();

                return {
                    name: name,
                    value: value,
                    isMulti: false
                } as Choice;
            }),
        }) as string[];

        answers.forEach(answer => {
            console.log(answer)
            const item = this.values.find(
                v => (typeof v !== 'string') && v.getName() === answer
            );

            if (item instanceof Action) {
                item.run();
            } else if (item instanceof Menu) {
                item.print();
            }
        });

        return this;
    }

}

type ActionType = 'goto' | 'function';
type ActionsJson = ActionGotoJson | ActionFunctionJson;
type ActionsClass = ActionGoTo | ActionFunction;

type ActionJson = {
    name: string;
    type: ActionType;
    global?: boolean;
};
type ActionObject = {
    name: string;
    type: ActionType;
    global: boolean;
};

abstract class Action {
    protected name: ActionObject['name'];
    protected abstract type: ActionObject['type'];
    protected global: ActionObject['global'];

    constructor(
        nameOrParams: ActionJson | string,
        global: boolean = false
    ) {
        if (typeof nameOrParams === 'string') {
            const name = nameOrParams as string;
            this.name = name;
            this.global = global ?? false;
        } else {
            const params = nameOrParams as ActionJson;
            this.name = params.name;
            this.global = params.global ?? false;
        }
    }

    public getName(): ActionObject['name'] { return this.name; }

    public getGlobal(): ActionObject['global'] { return this.global; }
    public isGlobal(): boolean { return this.getGlobal() === true; }

    public abstract getType(): ActionObject['type'];

    public toJson(): ActionJson {
        return {
            name: this.getName(),
            type: this.getType(),
            global: this.getGlobal()
        };
    }

    public clone(): this {
        const Constructor = this.constructor as new (name: string, global: boolean) => this;
        return new Constructor(this.getName(), this.getGlobal());
    }

    public abstract run(): Promise<unknown>;
}

type ActionGotoJson = { type: 'goto' } & Omit<ActionJson, 'type'> & {
    to?: string;
    from?: string;
};
type ActionGotoToObject = Menu | Action | string;
type ActionGotoFromObject = Menu | Action | string;
type ActionGotoObject = { type: ActionGotoJson['type'] } & Omit<ActionObject, 'type'> & {
    to?: ActionGotoToObject;
    from?: ActionGotoFromObject;
}

class ActionGoTo extends Action {
    protected type: ActionGotoObject['type'] = 'goto';
    protected to?: ActionGotoToObject;
    protected from?: ActionGotoFromObject;

    constructor(params: ActionGotoJson);
    constructor(
        name: string,
        global?: boolean,
        to?: ActionGotoToObject,
        from?: ActionGotoFromObject
    );

    constructor(
        nameOrParams: ActionGotoJson | string,
        global?: boolean,
        to?: ActionGotoToObject,
        from?: ActionGotoFromObject
    ) {
        super(nameOrParams, global);

        if (typeof nameOrParams === 'string') {
            this.to = to;
            this.from = from;
        } else {
            this.to = nameOrParams.to;
            this.from = nameOrParams.from;
        }
    }

    public getType(): ActionGotoObject['type'] { return this.type; }

    public getTo(): ActionGotoToObject | undefined { return this.to; }
    public setTo(to: Exclude<ActionGotoToObject, string>): this { this.to = to; return this; }
    public isTo(): boolean { return this.to !== undefined; }
    public isToString(): boolean { return this.isTo() && (typeof this.to === 'string'); }

    public getFrom(): ActionGotoFromObject | undefined { return this.from; }
    public setFrom(from: Exclude<ActionGotoFromObject, string>): this { this.from = from; return this; }
    public isFrom(): boolean { return this.from !== undefined; }
    public isFromString(): boolean { return this.isFrom() && (typeof this.from === 'string'); }

    public toJson(): ActionGotoJson {
        return {
            ...super.toJson(),
            type: this.getType(),
            to: this.isToString()
                ? this.getTo() as string
                : (this.getTo() as Menu | Action | undefined)?.getName(),
            from: this.isFromString()
                ? this.getFrom() as string
                : (this.getFrom() as Menu | Action | undefined)?.getName(),
        };
    }

    public override clone(): this {
        const action = super.clone() as this;
        if (this.isTo()) {
            action.to = cloneDeep(this.getTo());
        }
        if (this.isFrom()) {
            action.from = cloneDeep(this.getFrom());
        }
        return action;
    }

    public async run(): Promise<unknown> {
        const item = this.getTo() ?? this.getFrom();
        if (item) {
            if (item instanceof Action) {
                return (item as Action).run();
            } else if (item instanceof Menu) {
                return (item as Menu).print();
            }
        }
    }
}

type ActionFunctionJson = { type: 'function' } & Omit<ActionJson, 'type'> & {
    callback: () => Promise<unknown>;
};
type ActionFunctionObject = { type: ActionFunctionJson['type'] } & Omit<ActionObject, 'type'> & {
    callback: () => Promise<unknown>;
};
class ActionFunction extends Action {
    protected type: ActionFunctionObject['type'] = 'function';
    protected callback: ActionFunctionObject['callback'];

    constructor(params: ActionFunctionJson);
    constructor(
        name: string,
        global: boolean,
        callback: () => Promise<unknown>
    );

    constructor(
        nameOrParams: ActionFunctionJson | string,
        global?: boolean,
        callback?: () => Promise<unknown>
    ) {
        super(nameOrParams, global);

        if (typeof nameOrParams === 'string') {
            this.callback = callback!;
        } else {
            this.callback = nameOrParams.callback;
        }
    }

    public getType(): ActionFunctionObject['type'] { return this.type; }

    public toJson(): ActionFunctionJson {
        return {
            ...super.toJson(),
            type: this.getType(),
            callback: this.callback,
        };
    }

    public override clone(): this {
        const action = super.clone() as this;
        action.callback = this.callback;
        return action;
    }

    public async run(): Promise<unknown> {
        return await this.callback();
    }
}

const plugins = new Plugins([
    {
        name: "default",
        menus: [
            {
                name: "main",
                values: [
                    "action1",
                    "action2",
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
            {
                name: "action2",
                type: "function",
                callback: async () => { console.log('Action 2 executed'); }
            }
        ]
    },
    {
        name: "example",
        menus: [
            {
                name: "submenu1",
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
                name: "msubmenu2",
                type: "goto",
                to: "submenu2",
                from: "main"
            }
        ]
    }
]);

/*const plugins = new Plugins([
    new Plugin(
        'default',
        [
            new Menu('main', [ 'action1', 'action2' ]),
        ],
        [
            new ActionGoTo('back'),
            new ActionFunction('exit', true, async () => { 
                console.log('Exiting...'); 
                process.exit(0); 
            }),
            new ActionFunction('action1', false, async () => { console.log('Action 1 executed'); } ),
            new ActionFunction('action2', false, async () => { console.log('Action 2 executed'); } ),
        ]
    ),
    new Plugin(
        'example',
        [
            new Menu('submenu1', [ 'subaction1', 'subaction2' ], [ 'main' ]),
            new Menu('submenu2', [ 'subaction3', 'subaction4' ], [ 'submenu1' ]),
        ],
        [
            new ActionFunction('subaction1', false, async () => { console.log('SubAction 1 executed'); } ),
            new ActionFunction('subaction2', false, async () => { console.log('SubAction 2 executed'); } ),
            new ActionFunction('subaction3', false, async () => { console.log('SubAction 3 executed'); } ),
            new ActionFunction('subaction4', false, async () => { console.log('SubAction 4 executed'); } ),
        ]
    ),
    new Plugin('exmaple2', [], [
        new ActionGoTo('msubmenu2', false,  'submenu2', 'main')!
    ])
]);*/


//const mainMenu = new Menu('main', [
//    new Action('action1'),
//    new Action('action2'),
//]);

//const submenu1 = new Menu('submenu1', [
//    new Action('subaction1'),
//    new Action('subaction2'),
//], [
//    plugin.getMenu('main')!
//]);

//const submenu2 = new Menu('submenu2', [
//    new Action('subaction3'),
//    new Action('subaction4'),
//], [
//    plugin.getMenu('submenu1')!
//]);

//submenu1
//    .addValue(submenu2)
//    .addValue(back.clone().setFrom(plugin.getMenu('main')!));

//submenu2.addValue(back.clone().setFrom(submenu1));

//plugin.getMenu('main')!.addValue(submenu1);

plugins.getMenu('main')!.print();

//console.log(JSON.stringify(plugins.toJson()))