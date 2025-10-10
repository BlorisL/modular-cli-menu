import { Choice, choices, Separator } from "@/prompts/Choices";

type PluginConfig = {
    name: string;
    menus?: MenuConfig[];
    actions?: ActionConfig[];
};

type MenuConfig = {
    name: string;
    parents?: string[];
    values: string[];
};

type ActionConfig = {
    name: string;
    global?: boolean;
};

class Tree {
    protected plugins: Plugins;
    protected item: Menu;

    public constructor(plugins: Plugins) {
        this.plugins = plugins;
        this.item = this.load();
    }

    protected load(menu?: Menu): Menu {
        if(!menu) {
            menu = this.plugins.getMenu('main', 'default')!;
        }
        menu = menu?.clone();
        menu?.getValues().forEach(value => {
            const tmp = typeof value === 'string'
                ? (this.plugins.findMenu(value) ?? this.plugins.findAction(value))
                : value;
            if(tmp) {
                menu.addValue(tmp.clone().setFrom(menu));
                if(tmp instanceof Menu) {
                    this.load(tmp);
                }
            }
        });
        console.log(menu?.getParents())
        menu?.getParents()?.forEach(parent => {
            const tmp = typeof parent === 'string'
                ? (this.plugins.getMenu(parent) ?? this.plugins.getAction(parent))
                : parent;
            if(tmp) {
                menu.addParent(tmp);
                if(tmp instanceof Menu) {
                    tmp.addValue(menu.clone().setFrom(tmp));
                    this.load(tmp);
                }
            }
        });

        return menu;
    }

    public getPlugins(): Plugins { return this.plugins; }

    public getItem(): Menu { return this.item; }

    public print(): Promise<unknown> {
        return this.item.print(this.plugins.getGlobalActions());
    }
}

class Plugin {
    protected name: string;
    protected menus: Record<string, Menu> = {};
    protected actions: Record<string, Action> = {};

    public constructor(config: PluginConfig) {
        this.name = config.name;
        config.menus?.forEach(menuConfig => this.addMenu(new Menu(menuConfig)));
        config.actions?.forEach(actionConfig => this.addAction(new Action(actionConfig)));
    }

    public getName(): string { return this.name; }

    public getMenus(): Menu[] { return Object.values(this.menus); }

    public getMenu(name: string): Menu | undefined { return this.menus[name]; }
    public addMenu(menu: Menu | MenuConfig | Array<Menu | MenuConfig>): this {
        const items = Array.isArray(menu) ? menu : [menu];

        items.forEach(item => {
            let instance: Menu | undefined = undefined;

            if (item instanceof Menu) {
                instance = item;
            } else {
                instance = new Menu(item);
            }

            if(instance) {
                this.menus[instance.getName()] = instance.setPlugin(this.getName());
            }
        });

        return this;
    }

    public getActions(): Action[] { return Object.values(this.actions); }

    public getAction(name: string): Action | undefined { return this.actions[name]; }
    public addAction(action: Action | ActionConfig | Array<Action | ActionConfig>): this {
        const items = Array.isArray(action) ? action : [action];

        items.forEach(item => {
            let instance: Action | undefined = undefined;

            if (item instanceof Action) {
                instance = item;
            } else {
                instance = new Action(item);
            }

            if(instance) {
                this.actions[instance.getName()] = instance.setPlugin(this.getName());
            }
        });

        return this;
    }

    public getGlobalActions(): Action[] {
        return this.getActions().filter(action => action.isGlobal());
    }

    public toJson(): PluginConfig {
        return {
            name: this.getName(),
            menus: this.getMenus().map(menu => menu.toJson()),
            actions: this.getActions().map(action => action.toJson())
        };
    }
}

class Plugins {
    protected items: Record<string, Plugin> = {};

    public constructor(plugins: Plugin | PluginConfig | Array<Plugin | PluginConfig> = []) {
        this.add(plugins);
    }

    public getAll(): Plugin[] { return Object.values(this.items); }

    public get(name: string): Plugin | undefined { return this.items[name]; }
    public add(plugins: Plugin | PluginConfig | Array<Plugin | PluginConfig>): this {
        if (!Array.isArray(plugins)) {
            plugins = [plugins];
        }
        plugins.forEach(plugin => {
            if (!(plugin instanceof Plugin)) {
                plugin = new Plugin(plugin);
            }
            this.items[plugin.getName()] = plugin;
        });
        //this.checkEntity();

        return this;
    }

    public findMenu(menuName: string = '' , pluginName: string = ''): Menu | undefined {
        let menu: Menu | undefined = undefined;
        const plugin = this.get(pluginName);

        if(plugin) {
            menu = plugin.getMenu(menuName);
        }
        if(!menu) {
            this.getAll().some(p => {
                menu = p.getMenu(menuName);
                return !!menu;
            });
        }

        return menu;
    }
    public getMenu(menuName: string = '' , pluginName: string = ''): Menu | undefined {
        let menu: Menu | undefined = this.findMenu(menuName, pluginName);
        
        if(!menu) {
            menu = this.get('default')?.getMenu('main');
        }
        
        return menu;
    }

    public findAction(actionName: string = '', pluginName: string = ''): Action | undefined {
        let action: Action | undefined = undefined;
        const plugin = this.get(pluginName);

        if(plugin) {
            action = plugin.getAction(actionName);
        }
        if(!action) {
            this.getAll().some(p => {
                action = p.getAction(actionName);

                return !!action;
            });
        }

        return action;
    }
    public getAction(actionName: string = '', pluginName: string = ''): Action | undefined {
        return this.findAction(actionName, pluginName);
    }

    public getGlobalActions(): Action[] {
        let actions: Action[] = [];
        this.getAll().forEach(plugin => {
            actions = actions.concat(plugin.getGlobalActions());
        });
        return actions;
    }

    protected checkEntity(): this {
        this.getAll().forEach(plugin => {
            plugin.getMenus().forEach(menu => {
                menu.getParents()?.forEach(parentName => {
                    if(typeof parentName === 'string') {
                        const parent = this.findMenu(parentName) ?? this.findAction(parentName);

                        if(parent) {
                            menu.addParent(parent);
                            if(parent instanceof Menu) {
                                parent.addValue(menu);
                            }
                        }
                    }
                });
                menu.getValues().forEach(valueName => {
                    if(typeof valueName === 'string') {
                        const value = this.findMenu(valueName) ?? this.findAction(valueName);

                        if(value) {
                            menu.addValue(value);
                        }
                    }
                });
            });
        });

        return this;
    }

    public toJson(): PluginConfig[] {
        return this.getAll().map(plugin => plugin.toJson());
    }

    public async print(menuName: string = '', pluginName: string = '') {
        const menu = this.getMenu(menuName, pluginName);
        if (menu) {
            return await menu.print(this.getGlobalActions());
        }
    }

    public async run(actionName: string = '', pluginName: string = '') {
        const action = this.getAction(actionName, pluginName);
        if (action) {
            return await action.run();
        }
    }
}

class Menu {
    protected plugin?: string;
    protected name: string;
    protected parents: Array<Menu | Action | string>;
    protected values: Array<Menu | Action | string>;
    protected from?: Menu | Action;

    public constructor(config: MenuConfig) {
        this.plugin = undefined;
        this.name = config.name;
        this.parents = config.parents ?? [];
        this.values = config.values;
        this.from = undefined;
    }

    public getPlugin(): string | undefined { return this.plugin; }
    public setPlugin(plugin: string): this { this.plugin = plugin; return this; }
    
    public getName(): string { return this.name; }

    public getParents(): Array<Menu | Action | string> | undefined { return this.parents; }
    public addParent(parent: Menu | Action | string): this { 
        if(this.parents.includes(parent)) {
            this.parents.splice(this.parents.indexOf(parent), 1, parent);
        } else {
            this.parents.push(parent);
        }
        return this; 
    }

    public getValues(): Array<Menu | Action | string> { return this.values; }
    public addValue(value: Menu | Action): this { 
        if(this.values.includes(value.getName())) {
            this.values.splice(this.values.indexOf(value.getName()), 1, value);
        } else {
            this.values.push(value);
        } 
        return this;
    }

    public setFrom(from: Menu | Action): this { this.from = from; return this; }
    public getFrom(): Menu | Action | undefined { return this.from; }

    public toJson(): MenuConfig {
        return {
            name: this.getName(),
            values: this.getValues().map(value => typeof value === 'string' ? value : value.getName())
        };
    }

    public clone(): Menu {
        return new Menu(this.toJson());
    }

    public async print(values: Action[] = []): Promise<unknown> {
        const items = [
            ...this.getValues().map(
                v => typeof v === 'string' ? v : v
            ),
            ...(values.length > 0 ? [new Separator()] : []),
            ...values.map(v => {
                return v;
            })
        ];

        const answers = await choices({
            message: `Select an action from menu "${this.getName()}"`,
            choices: items.map(v => {
                return v instanceof Separator ? v : {
                    name: typeof v === 'string' ? v : v.getName(),
                    value: typeof v === 'string' ? v : v.getName(),
                    isMulti: false
                };
        }),
        }) as string[];

        answers.forEach(answer => {
            console.log(answer)
            const item = items.find(
                v => (typeof v !== 'string' && !(v instanceof Separator)) && v.getName() === answer
            );

            if(item instanceof Action) {
                item.run();
            } else if(item instanceof Menu) {
                item.print(values);
            }
        });

        return this;
    }

}

class Action {
    protected plugin?: string;
    protected name: string;
    protected global: boolean;
    protected from?: Menu | Action;

    public constructor(config: ActionConfig) {
        this.plugin = undefined;
        this.name = config.name;
        this.global = config.global ?? false;
        this.from = undefined;
    }

    public getPlugin(): string | undefined { return this.plugin; }
    public setPlugin(plugin: string): this { this.plugin = plugin; return this; }

    public getName(): string { return this.name; }

    public getGlobal(): boolean { return this.global; }
    public isGlobal(): boolean { return this.getGlobal() === true; }

    public setFrom(from: Menu | Action): this { this.from = from; return this; }
    public getFrom(): Menu | Action | undefined { return this.from; }

    public toJson(): ActionConfig {
        return {
            name: this.getName(),
            global: this.getGlobal(),
        };
    }

    public clone(): Action {
        const action = new Action(this.toJson());
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
    { 
        name: 'default',
        menus: [
            { name: 'main', values: ['action1', 'action2'] },
        ],
        actions: [
            { name: 'back', global: true },
            { name: 'exit', global: true },
            { name: 'action1' },
            { name: 'action2' },
        ]
    },
    { 
        name: 'test1',
        menus: [
            { name: 'submenu1', parents: ['main'], values: ['subaction1', 'subaction2'] },
        ],
        actions: [
            { name: 'subaction1' },
            { name: 'subaction2' },
        ]
    },
    { 
        name: 'test2',
        menus: [
            { name: 'submenu2', parents: ['submenu1'], values: ['subaction3', 'subaction4'] },
        ],
        actions: [
            { name: 'subaction3' },
            { name: 'subaction4' },
        ]
    }
]);

const tree = new Tree(plugins);

tree.print();

/*
const pluginMain = new Plugin();

const pluginSubMenu1 = new Plugin();

const pluginSubMenu2 = new Plugin();

plugin.getMenu('main')?.addValue(plugin.getAction('action1')!);
plugin.getMenu('main')?.addValue(plugin.getAction('action2')!);
plugin.getMenu('main')?.addValue(plugin.getMenu('submenu1')!);

plugin.getMenu('submenu1')?.addValue(plugin.getAction('subaction1')!);
plugin.getMenu('submenu1')?.addValue(plugin.getAction('subaction2')!);
plugin.getMenu('submenu1')?.addValue(plugin.getMenu('submenu2')!);
plugin.getMenu('submenu1')?.addValue(plugin.getAction('back')!.clone().setFrom(plugin.getMenu('main')!));

plugin.getMenu('submenu2')?.addValue(plugin.getAction('subaction3')!);
plugin.getMenu('submenu2')?.addValue(plugin.getAction('subaction4')!);
plugin.getMenu('submenu2')?.addValue(plugin.getAction('back')!.clone().setFrom(plugin.getMenu('submenu1')!));

plugin.getMenu('main')?.print();
*/
/*
const back = new Action({ name: 'back' });
const action1 = new Action({ name: 'action1' });
const action2 = new Action({ name: 'action2' });
const subaction1 = new Action({ name: 'subaction1' });
const subaction2 = new Action({ name: 'subaction2' });
const subaction3 = new Action({ name: 'subaction3' });
const subaction4 = new Action({ name: 'subaction4' });

const submenu1 = new Menu({
    name: 'submenu1', 
    values: [ 'subaction1', 'subaction2' ]
});
const submenu2 = new Menu({
    name: 'submenu2', 
    values: [ 'subaction3', 'subaction4' ]
});
const mainMenu = new Menu({
    name: 'main', 
    values: [ 'action1', 'action2' ]
});

submenu1
    .addValue(subaction1)
    .addValue(subaction2)
    .addValue(submenu2)
    .addValue(back.clone().setFrom(mainMenu));

submenu2
    .addValue(subaction3)
    .addValue(subaction4)
    .addValue(back.clone().setFrom(submenu1));

mainMenu
    .addValue(action1)
    .addValue(action2)
    .addValue(submenu1);

mainMenu.print();*/