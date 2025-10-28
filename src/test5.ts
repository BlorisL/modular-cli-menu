import { Choice, choices } from "@/prompts/Choices";

class Plugin {
    protected name: string;
    protected menus: Record<string, Menu>;
    protected actions: Record<string, Action>;

    public constructor(name: string, menus: Plugin['menus'][string][] = [], actions: Plugin['actions'][string][] = []) {
        this.name = name;
        this.menus = {};
        this.actions = {};

        menus.map(m => this.addMenu(m));
        actions.map(a => this.addAction(a));
    }

    public getName(): string { return this.name; }

    public getMenus(): Plugin['menus'][string][] { return Object.values(this.menus); }
    public getMenu(name: string): Plugin['menus'][string] | undefined { return this.menus[name]; }
    public addMenu(menu: Menu): this { this.menus[menu.getName()] = menu; return this; }

    public getActions(): Plugin['actions'][string][] { return Object.values(this.actions); }
    public getAction(name: string): Plugin['actions'][string] | undefined { return this.actions[name]; }
    public addAction(action: Action): this { this.actions[action.getName()] = action; return this; }

    public clone(): Plugin {
        return new Plugin(
            this.getName(), 
            this.getMenus().map(m => m.clone()), 
            this.getActions().map(a => a.clone())
        );
    }
}

class Plugins {
    protected items: Record<string, Plugin>;

    public constructor(plugins: Plugin[] = []) {
        this.items = {};

        plugins.map(p => this.addPlugin(p));
    }

    public getAll(): Plugin[] { return Object.values(this.items); }
    public getPlugin(name: string): Plugin | undefined { return this.items[name]; }
    public addPlugin(plugin: Plugin): this { 
        this.items[plugin.getName()] = plugin; 
        this.load();
        return this; 
    }

    public getMenus(): Menu[] { return this.getAll().flatMap(plugin => plugin.getMenus()); }
    public findMenu(menuName: string = '', pluginName: string = ''): Menu | undefined {
        let menu: Menu | undefined = this.getMenu(menuName, pluginName);

        if (!menu) {
            menu = this.getPlugin('default')?.getMenu('main');
        }

        return menu;
    }
    public getMenu(menuName: string = '', pluginName: string = ''): Menu | undefined {
        let menu: Menu | undefined = undefined;
        const plugin = this.getPlugin(pluginName);

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
        const plugin = this.getPlugin(pluginName);

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

    public clone(): Plugins {
        return new Plugins(
            this.getAll().map(p => p.clone())
        );
    }

    protected load(): void {
        const back = this.getAction('back')!;

        this.getMenus().forEach(menu => {
            /*menu.getParents().map(parent => {
                if(typeof parent === 'string') {
                    const item = this.getMenu(parent) || this.getAction(parent);
                    if(item) {
                        menu.addParent(item);
                    }
                    if(item instanceof Menu) {
                        const tmp = item.clone();
                        //if(tmp instanceof Menu) {
                        //    tmp.addValue(back.clone().setFrom(menu));
                        //}
                        item.addValue(tmp);
                    }
                } else {
                    //if(parent instanceof Menu) {
                    //    parent.addValue(back.clone().setFrom(menu));
                    //}
                }
            });*/
            menu.getValues().forEach(value => {
                if(typeof value === 'string') {
                    const item = this.getMenu(value) || this.getAction(value);
                    //console.log('VALUE', menu.getName(), value, menu)
                    if(item) {
                        const tmp = item.addParent(menu).clone();
                        //if(tmp instanceof Menu) {
                        //    tmp.addValue(back.clone().setFrom(menu));
                        //}
                        menu.addValue(tmp);
                    }
                    //console.log('VALUE', menu.getName(), value, menu)
                } else {
                    value.addParent(menu)
                    //if(value instanceof Menu) {
                    //    value.addValue(back.clone().setFrom(menu));
                    //}
                }
            });
        });
        this.getActions().forEach(action => {
            console.log('###1', action.getName(), action.getParents())
            action.getParents().map(parent => {
                console.log(action.getName(), parent)
                if(typeof parent === 'string') {
                    const item = this.getMenu(parent) || this.getAction(parent);
            console.log('###2', item)
                    if(item && item instanceof Menu) {
                        item.addValue(action);
                    }
                } else {
                    if(parent instanceof Menu) {
                        parent.addValue(action);
                    }
                }
            });
        });
        this.getMenus().forEach(menu => {
            console.log('###1', menu.getName(), menu.getParents())
            menu.getParents().map(parent => {
                console.log(menu.getName(), parent)
                if(typeof parent === 'string') {
                    const item = this.getMenu(parent) || this.getAction(parent);
            console.log('###2', item)
                    if(item && item instanceof Menu) {
                        menu.addValue(back.clone().setFrom(item.addValue(menu)));
                    }
                } else {
                    if(parent instanceof Menu) {
                        menu.addValue(back.clone().setFrom(parent.addValue(menu)));
                    }
                }
            });
        });
    }
}

class Menu {
    protected name: string;
    protected parents: Record<string, Menu | Action | string>;
    protected values: Array<Menu | Action | string>;

    public constructor(name: string, parents: Menu['parents'][string][] = [], values: Menu['values'] = []) {
        this.name = name;
        this.parents = {};
        this.values = values;

        parents.map(p => this.parents[typeof p === 'string' ? p : p.getName()] = p);
    }
    
    public getName(): string { return this.name; }

    public getParents(): Menu['parents'][string][] { return Object.values(this.parents); }
    public getParent(parent: string): Menu['parents'][string] | undefined { return this.parents[parent]; }
    public addParent(parent: Exclude<Menu['parents'][number], string>): this {
        this.parents[parent.getName()] = parent;

        return this;
    }

    public getValues(): Menu['values'] { return this.values; }
    public getValue(valueName: string): Menu['values'][number] | undefined {
        return this.values.find(
            v => (typeof v === 'string' ? v : v.getName()) === valueName
        );
    }
    public addValue(value: Exclude<Menu['values'][number], string>): this {
        if(this.getValue(value.getName())) {
            const index = this.values.findIndex(
                v => (typeof v === 'string' ? v : v.getName()) === value.getName()
            );
            if(index !== -1) {
                this.values.splice(index, 1, value);
            }
        } else {
            this.values.push(value);
        }

        return this;
    }

    public clone(): Menu {
        return new Menu(
            this.getName(), 
            this.getParents().map(p => typeof p === 'string' ? p : p.clone()), 
            this.getValues()
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

class Action {
    protected name: string;
    protected parents: Record<string, Menu | Action | string>;
    protected from?: Menu | Action;

    public constructor(name: string, parents: Action['parents'][string][] = []) {
        this.name = name;
        this.parents = {};
        this.from = undefined;

        parents.map(p => this.parents[typeof p === 'string' ? p : p.getName()] = p);
    }

    public getName(): string { return this.name; }

    public getParents(): Action['parents'][string][] { return Object.values(this.parents); }
    public getParent(parent: string): Action['parents'][string] | undefined { return this.parents[parent]; }
    public addParent(parent: Exclude<Menu['parents'][number], string>): this {
        this.parents[parent.getName()] = parent;

        return this;
    }

    public setFrom(from: Menu): this { this.from = from; return this; }
    public getFrom(): Menu | Action | undefined { return this.from; }

    public clone(): Action {
        const action = new Action(
            this.getName(), 
            this.getParents().map(p => typeof p === 'string' ? p : p.clone()), 
        );
        //action.setFrom(this.getFrom()!);
        return action;
    }

    public async run(): Promise<unknown> {
        if(this.getFrom()) {
            if(this.getFrom() instanceof Action) {
                return (this.getFrom() as Action).run();
            } else if(this.getFrom() instanceof Menu) {
                return (this.getFrom() as Menu).print();
            }
        }
    }
}

const plugins = new Plugins([
    new Plugin(
        'default',
        [
            new Menu('main'),
        ],
        [
            new Action('back'),
        ]
    ),
    new Plugin(
        'example',
        [
            new Menu(
                'submenu1',
                ['main'],
                [
                    new Action('subaction1'),
                    new Action('subaction2'),
                ]
            ),
            new Menu(
                'submenu2',
                ['submenu1'],
                [
                    new Action('subaction3'),
                    'subaction4'
                ]
            ),
        ],
        [
            new Action('action1', ['main']),
            new Action('action2', ['main']),
            new Action('subaction4'),
        ]
    )
]);

plugins.getMenu('main')?.print();

/*const back = new Action('back');

const submenu1 = new Menu('submenu1', [
    new Action('subaction1'),
    new Action('subaction2'),
]);
const submenu2 = new Menu('submenu2', [
    new Action('subaction3'),
    new Action('subaction4'),
]);

const mainMenu = new Menu('main', [
    new Action('action1'),
    new Action('action2'),
]);

submenu1
    .addValue(submenu2)
    .addValue(back.clone().setFrom(mainMenu));

submenu2.addValue(back.clone().setFrom(submenu1));

mainMenu.addValue(submenu1);

mainMenu.print();*/