import { Choice, choices } from "@/prompts/Choices";


class Plugin {
    protected name: string;
    protected menus: Record<string, Menu>;
    protected actions: Record<string, Action>;

    public constructor(name: string, menus: Menu[] = [], actions: Action[] = []) {
        this.name = name;
        this.menus = {};
        this.actions = {};

        menus.forEach(menu => this.addMenu(menu));
        actions.forEach(action => this.addAction(action));
    }

    public getName(): string { return this.name; }


    public getMenus(): Menu[] { return Object.values(this.menus); }
    public getMenu(name: string): Menu | undefined { return this.menus[name]; }
    public addMenu(menu: Menu): this { this.menus[menu.getName()] = menu; return this; }

    public getActions(): Action[] { return Object.values(this.actions); }
    public getAction(name: string): Action | undefined { return this.actions[name]; }
    public addAction(action: Action): this {  this.actions[action.getName()] = action; return this; }

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
}

class Plugins {
    protected items: Record<string, Plugin> = {};

    public constructor(plugins: Plugin[] = []) {
        plugins.forEach(plugin => this.add(plugin));
    }

    public getAll(): Plugin[] { return Object.values(this.items); }

    public get(name: string): Plugin | undefined { return this.items[name]; }
    public add(plugin: Plugin): this {
        this.items[plugin.getName()] = plugin;
        this.checkEntities();
        return this;
    }

    public findMenu(menuName: string = '' , pluginName: string = ''): Menu | undefined {
        let menu: Menu | undefined = this.getMenu(menuName, pluginName);

        if(!menu) {
            menu = this.get('default')?.getMenu('main');
        }

        return menu;
    }
    public getMenu(menuName: string = '' , pluginName: string = ''): Menu | undefined {
        let menu: Menu | undefined = undefined;
        const plugin = this.get(pluginName);

        if(plugin) {
            menu = plugin.getMenu(menuName);
        } else {
            this.getAll().some(p => {
                menu = p.getMenu(menuName);
                return !!menu;
            });
        }

        return menu;
    }
    
    public getAction(actionName: string = '', pluginName: string = ''): Action | undefined {
        let action: Action | undefined = undefined;
        const plugin = this.get(pluginName);

        if(plugin) {
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

    protected checkEntities(): void {
        const back = this.getGoToAction('back')!;
        const globalActions = this.getGlobalActions();

        Object.values(this.items).forEach(plugin => {
            Object.values(plugin.getMenus()).forEach(menu => {
                menu.getValues().forEach(value => {
                    if(typeof value === 'string') {
                        const item = this.getMenu(value) ?? this.getAction(value);

                        if(item) {
                            menu.addValue(item);
                            if(item instanceof Menu) {
                                console.log('add', menu.getName(), 'to', item.getName());
                                if(menu.getName() !== item.getName()) {
                                    menu.addValue(back.clone().setFrom(item));
                                }
                            }
                        }
                    }
                });
                menu.getParents().forEach((parent, index) => {
                    if(typeof parent === 'string') {
                        const item = this.getMenu(parent) ?? this.getAction(parent);
                        if(item) {
                            menu.addParent(item);
                            if(item instanceof Menu) {
                                item.addValue(menu);
                                if(menu.getName() !== item.getName()) {
                                    console.log(menu.getName(), 'add back to', item.getName());
                                    menu.addValue(back.clone().setFrom(item));
                                }
                            }
                        }
                    }
                });
            });
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

class Menu {
    protected name: string;
    protected values: Array<Menu | Action | string>;
    protected parents: Array<Menu | Action | string>;

    public constructor(
        name: string, 
        values: Array<Menu | Action | string> = [],
        parents: Array<Menu | Action | string> = []
    ) {
        this.name = name;
        this.values = values;
        this.parents = parents;
    }
    
    public getName(): string { return this.name; }

    public getValues(): Array<Menu | Action | string> { return this.values; }
    public getValue(name: string): Menu | Action | string | undefined {
        return this.values.find(v => {
            if(typeof v === 'string') {
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
        if(this.getValue(value.getName())) {
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
        if(this.parents.includes(parent.getName())) {
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

    public clone(): Menu {
        return new Menu(this.getName(), this.getValues());
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

            if(item instanceof Action) {
                item.run();
            } else if(item instanceof Menu) {
                item.print();
            }
        });

        return this;
    }

}

abstract class Action {
    protected name: string;
    protected abstract type: string;
    protected global: boolean;

    public constructor(name: string, global: boolean = false) {
        this.name = name;
        this.global = global;
    }

    public getName(): string { return this.name; }

    public getGlobal(): boolean { return this.global; }
    public isGlobal(): boolean { return this.getGlobal() === true; }

    public getType(): string { return this.type; }


    public clone(): this {
        const Constructor = this.constructor as new (name: string, global: boolean) => this;
        return new Constructor(this.getName(), this.getGlobal());
    }

    public abstract run(): Promise<unknown>;
}

class ActionGoTo extends Action {
    protected type = 'goto';
    protected to?: Menu | Action;
    protected from?: Menu | Action;

    public constructor(
        name: string, 
        global: boolean = false, 
        to?: Menu | Action, 
        from?: Menu | Action
    ) {
        super(name, global);
        this.to = to;
        this.from = from;
    }

    public getTo(): Menu | Action | undefined { return this.to; }
    public isTo(): boolean { return this.to !== undefined; }

    public setFrom(from: Menu): this { this.from = from; return this; }
    public getFrom(): Menu | Action | undefined { return this.from; }
    public isFrom(): boolean { return this.from !== undefined; }

    public override clone(): this {
        const action = super.clone() as this;
        if(this.isTo()) {
            action.to = this.getTo();
        }
        if(this.isFrom()) {
            action.from = this.getFrom();
        }
        return action;
    }

    public async run(): Promise<unknown> {
        const item: Menu | Action | undefined = this.getTo() ?? this.getFrom();
        if(item) {
            if(item instanceof Action) {
                return (item as Action).run();
            } else if(item instanceof Menu) {
                return (item as Menu).print();
            }
        }
    }
}

class ActionFunction extends Action {
    protected type = 'function';
    protected callback: () => Promise<unknown>;

    public constructor(
        name: string, 
        global: boolean = false, 
        callback: () => Promise<unknown>
    ) {
        super(name, global);
        this.callback = callback;
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

const back = new ActionGoTo('back');

const plugins = new Plugins([
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
            new Menu('submenu1', [ 'subaction1', 'subaction2' ], [ 'main']),
            new Menu('submenu2', [ 'subaction3', 'subaction4' ], [ 'submenu1']),
        ],
        [
            new ActionFunction('subaction1', false, async () => { console.log('SubAction 1 executed'); } ),
            new ActionFunction('subaction2', false, async () => { console.log('SubAction 2 executed'); } ),
            new ActionFunction('subaction3', false, async () => { console.log('SubAction 3 executed'); } ),
            new ActionFunction('subaction4', false, async () => { console.log('SubAction 4 executed'); } ),
        ]
    )
]);


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