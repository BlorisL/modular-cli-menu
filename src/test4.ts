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
    menus: MenuJson[];
    actions: Array<ActionGoToJson | ActionFunction>;
};

class Plugin {
    protected name: string;
    protected menus: Record<string, Menu>;
    protected actions: Record<string, Action>;

    public constructor(params: PluginJson) {
        this.name = params.name;
        this.menus = {};
        this.actions = {};

        params.menus.forEach(menu => this.addMenu(new Menu(menu)));
        params.actions.forEach(action => {
            const aType = (action as any).type;
            if (aType === 'goto') {
                this.addAction(new ActionGoTo(action as ActionGoToJson));
            } else if (aType === 'function') {
                this.addAction(new ActionFunction(action as ActionFunctionJson));
            }
        });
    }

    public getName(): string { return this.name; }


    public getMenus(): Menu[] { return Object.values(this.menus); }
    public getMenu(name: string): Menu | undefined { return this.menus[name]; }
    public addMenu(menu: Menu): this { this.menus[menu.getName()] = menu; return this; }

    public getActions(): Action[] { return Object.values(this.actions); }
    public getAction(name: string): Action | undefined { return this.actions[name]; }
    public addAction(action: Action): this { this.actions[action.getName()] = action; return this; }

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

class Plugins {
    protected items: Record<string, Plugin> = {};

    public constructor(plugins: PluginJson[] = []) {
        plugins.forEach(plugin => this.add(new Plugin(plugin)));
    }

    public getAll(): Plugin[] { return Object.values(this.items); }

    public get(name: string): Plugin | undefined { return this.items[name]; }
    public add(plugin: Plugin): this {
        this.items[plugin.getName()] = plugin;
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

    public toJson(): PluginJson[] {
        return this.getAll().map(p => p.toJson());
    }

    protected checkEntities(): void {
        const back = this.getGoToAction('back')!;
        const globalActions = this.getGlobalActions();

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
                    const backup = this.getMenu(action.getTo() as string) ?? this.getAction(action.getTo() as string);
                    const item = (this.getMenu(action.getTo() as string) ?? this.getAction(action.getTo() as string))?.clone();
                    if (item) {
                        console.log('A Set to', item.getName(), 'for action', action.getName());
                        if (item instanceof Menu && action.getFrom() instanceof Menu) {
                            const menu = action.getFrom() as Menu;
                            console.log('A add', menu.getName(), 'to back', item.getName());
                            if (item.getName() !== menu.getName()) {
                                console.log(0,
                                    (((backup as Menu).getValues().find(
                                        v => !(typeof v === 'string') && v?.getName() == 'back'
                                    ) as ActionGoTo | undefined)?.getFrom() as Menu | Action | undefined)?.getName(),
                                    ((item.getValues().find(
                                        v => !(typeof v === 'string') && v?.getName() == 'back'
                                    ) as ActionGoTo | undefined)?.getFrom() as Menu | Action | undefined)?.getName()
                                )
                                item.addValue(back.clone().setFrom(menu));
                                console.log(1,
                                    (((backup as Menu).getValues().find(
                                        v => !(typeof v === 'string') && v?.getName() == 'back'
                                    ) as ActionGoTo | undefined)?.getFrom() as Menu | Action | undefined)?.getName(),
                                    ((item.getValues().find(
                                        v => !(typeof v === 'string') && v?.getName() == 'back'
                                    ) as ActionGoTo | undefined)?.getFrom() as Menu | Action | undefined)?.getName()
                                )
                            }
                        }
                        action.setTo(item);
                    }
                }
            }
        });
        this.getGlobalActions().forEach(action => {
            this.getAll().forEach(plugin => {
                plugin.getMenus().forEach(menu => {
                    menu.addValue(action.clone());
                });
            });
        });
    }
}

type MenuJson = {
    name: string
    values: string[];
    parents: string[];
};

class Menu {
    protected name: string;
    protected values: Array<Menu | Action | string>;
    protected parents: Array<Menu | Action | string>;

    public constructor(params: MenuJson) {
        this.name = params.name;
        this.values = params.values ?? [];
        this.parents = params.parents ?? [];
    }

    public getName(): string { return this.name; }

    public getValues(): Array<Menu | Action | string> { return this.values; }
    public getValue(name: string): Menu | Action | string | undefined {
        return this.values.find(v => {
            if (typeof v === 'string') {
                return v === name ? v : undefined;
            } else {
                return v.getName() === name ? v : undefined;
            }
        });
    }
    public addValues(values: Array<Menu | Action>): this {
        values.forEach(value => this.addValue(value));
        return this;
    }
    public addValue(value: Menu | Action): this {
        if (this.getValue(value.getName())) {
            this.values.splice(
                this.values.findIndex(v => (typeof v !== 'string') && v.getName() === value.getName()),
                1,
                value
            );
        } else {
            this.values.push(value);
        }

        return this;
    }

    public getParents(): Array<Menu | Action | string> { return this.parents; }
    public addParent(parent: Menu | Action): this {
        if (this.parents.includes(parent.getName())) {
            this.parents.splice(
                this.parents.findIndex(p => (typeof p !== 'string') && p.getName() === parent.getName()),
                1,
                parent
            );
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
        return new Menu(this.toJson());
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

type ActionJson = {
    name: string;
    //type: string;
    global: boolean;
};

abstract class Action {
    protected name: string;
    protected abstract type: string;
    protected global: boolean;

    public constructor(params: ActionJson) {
        this.name = params.name;
        this.global = params.global ?? false;
    }

    public getName(): string { return this.name; }

    public getGlobal(): boolean { return this.global; }
    public isGlobal(): boolean { return this.getGlobal() === true; }

    public getType(): string { return this.type; }

    public toJson(): ActionJson {
        return {
            name: this.getName(),
            //type: this.getType(),
            global: this.getGlobal()
        };
    }

    public clone(): this {
        const Constructor = this.constructor as new (params: ActionJson) => this;
        return new Constructor(this.toJson());
    }

    public abstract run(): Promise<unknown>;
}

type ActionGoToJson = ActionJson & {
    type: string;
    to?: string;
    from?: string;
};

class ActionGoTo extends Action {
    protected type = 'goto';
    protected to?: Menu | Action | string;
    protected from?: Menu | Action | string;

    public constructor(params: ActionGoToJson) {
        const { type, to, from, ...others } = params;
        super(others);
        this.to = to;
        this.from = from;
    }

    public getTo(): Menu | Action | string | undefined { return this.to; }
    public setTo(to: Menu | Action): this { this.to = to; return this; }
    public isTo(): boolean { return this.to !== undefined; }
    public isToString(): boolean { return this.isTo() && (typeof this.to === 'string'); }

    public getFrom(): Menu | Action | string | undefined { return this.from; }
    public setFrom(from: Menu | Action): this { this.from = from; return this; }
    public isFrom(): boolean { return this.from !== undefined; }
    public isFromString(): boolean { return this.isFrom() && (typeof this.from === 'string'); }

    public toJson(): ActionGoToJson {
        return {
            ...super.toJson(),
            type: this.getType(),
            to: this.isToString() ? (this.getTo() as string) : (this.getTo() as Menu | Action | undefined)?.getName(),
            from: this.isFromString() ? (this.getFrom() as string) : (this.getFrom() as Menu | Action | undefined)?.getName(),
        };
    }

    public override clone(): this {
        const Constructor = this.constructor as new (params: ActionGoToJson) => this;
        return new Constructor(this.toJson());
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

type ActionFunctionJson = ActionJson & {
    type: string;
    callback: () => Promise<unknown>;
};

class ActionFunction extends Action {
    protected type = 'function';
    protected callback: () => Promise<unknown>;

    public constructor(params: ActionFunctionJson) {
        const { type, callback, ...others } = params;
        super(others);
        this.callback = callback;
    }

    public toJson(): ActionFunctionJson {
        return {
            ...super.toJson(),
            type: this.getType(),
            callback: this.callback,
        };
    }

    public override clone(): this {
        const Constructor = this.constructor as new (params: ActionFunctionJson) => this;
        return new Constructor(this.toJson());
    }

    public async run(): Promise<unknown> {
        return await this.callback();
    }
}

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

const plugins = new Plugins([
    {
        "name": "default",
        "menus": [
            {
                "name": "main",
                "values": [
                    "action1",
                    "action2",
                    "exit",
                    "submenu1",
                    "msubmenu2"
                ],
                "parents": []
            }
        ],
        "actions": [
            {
                "name": "back",
                "type": "goto",
                "global": false
            },
            {
                "name": "exit",
                "type": "function",
                "global": true
            },
            {
                "name": "action1",
                "type": "function",
                "global": false
            },
            {
                "name": "action2",
                "type": "function",
                "global": false
            }
        ]
    },
    {
        "name": "example",
        "menus": [
            {
                "name": "submenu1",
                "values": [
                    "subaction1",
                    "subaction2",
                    "back",
                    "submenu2",
                    "exit"
                ],
                "parents": [
                    "main"
                ]
            },
            {
                "name": "submenu2",
                "values": [
                    "subaction3",
                    "subaction4",
                    "back",
                    "exit"
                ],
                "parents": [
                    "submenu1"
                ]
            }
        ],
        "actions": [
            {
                "name": "subaction1",
                "type": "function",
                "global": false
            },
            {
                "name": "subaction2",
                "type": "function",
                "global": false
            },
            {
                "name": "subaction3",
                "type": "function",
                "global": false
            },
            {
                "name": "subaction4",
                "type": "function",
                "global": false
            }
        ]
    },
    {
        "name": "exmaple2",
        "menus": [],
        "actions": [
            {
                "name": "msubmenu2",
                "type": "goto",
                "global": false,
                "to": "submenu2",
                "from": "main"
            }
        ]
    }
])


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