import { choices } from "./prompts/Choices";

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

        if(data.parents) {
            data.parents.forEach(parent => this.addParent(parent));
        }
    }

    public getName(): Menu['name'] { return this.name; }

    public getType(): Menu['type'] { return this.type; }

    public getPlugin(): Menu['plugin'] | undefined { return this.plugin; }
    public setPlugin(plugin: Menu['plugin']): this { this.plugin = plugin; return this; }

    public getParents(): Menu['parents'][string][] { return Object.values(this.parents); }
    public getParent(name: string): Menu['parents'][string] | undefined { 
        return this.parents[name]; 
    }
    public addParent(name: Menu['parents'][string]): this { 
        this.parents[name] = name; 
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
        this.value = value; 
        /*if(value instanceof MenuChoice) {
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
        }*/
        return this; 
    }

    public isMulti(): MenuChoiceValue['multi'] { return this.multi === true; }

    public toJson() {
        return {
            name: this.name,
            value: typeof this.value === 'string' ? this.value : this.value.getName(),
            multi: this.multi
        };
    }
}

type MenuChoiceJson = MenuJson & {
    type: 'choice';
    values?: Array<string | MenuChoiceValueJson>;
};

class MenuChoice extends Menu {
    protected type: MenuChoiceJson['type'] = 'choice';
    protected values: Record<string, MenuChoiceValue> = {};

    constructor(data: MenuChoiceJson) {
        super(data);
        
        if(data.values) {
            data.values.forEach(v => this.addValue(v));
        }
    }

    public getValues(): MenuChoice['values'][string][] { return Object.values(this.values); }
    public getValue(name: string): MenuChoice['values'][string] | undefined { 
        return this.values[name]; 
    }
    public addValue(
        value: Menu | Action | MenuChoice['values'][string] | Exclude<MenuChoiceJson['values'], undefined>[number]
    ): this {
        if(value instanceof Menu || value instanceof Action) {
            this.values[value.getName()] = new MenuChoiceValue(value.getName());
        } else if(value instanceof MenuChoiceValue) {
            this.values[value.getName()] = value;
        } else if(typeof value === 'string') {
            this.values[value] = new MenuChoiceValue(value);
        } else if(!!value) {
            this.values[value.name] = new MenuChoiceValue(value.name, value.value, value.multi);
        }
        return this;
    }

    public toJson(): MenuChoiceJson {
        return {
            ...super.toJson(),
            type: this.type,
            values: Object.values(this.values).map(v => v.toJson())
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
    protected global: Exclude<ActionJson['global'], undefined> = false;

    constructor(data: ActionJson) {
        this.name = data.name;
        this.plugin = data.plugin;
        this.global = data.global ?? false;

        if(data.parents) {
            data.parents.forEach(parent => this.addParent(parent));
        }
    }

    public getName(): Action['name'] { return this.name; }

    public getType(): Action['type'] { return this.type; }

    public getPlugin(): Action['plugin'] | undefined { return this.plugin; }
    public setPlugin(plugin: Action['plugin']): this { this.plugin = plugin; return this; }

    public getParents(): Action['parents'][string][] { return Object.values(this.parents); }
    public getParent(name: string): Action['parents'][string] | undefined { 
        return this.parents[name]; 
    }
    public addParent(name: Action['parents'][string]): this { 
        this.parents[name] = name; 
        return this; 
    }

    public isGlobal(): Action['global'] { return this.global === true; }

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
    protected callback: ActionFunctionJson['callback'];

    constructor(data: ActionFunctionJson) {
        super(data);
        this.callback = data.callback;
    }

    public getCallback(): Promise<void> { return this.callback(); }
    public setCallback(callback: ActionFunction['callback']): this { 
        this.callback = callback; 
        return this; 
    }

    public toJson(): ActionFunctionJson {
        return {
            ...super.toJson(),
            type: this.type,
            callback: this.callback
        };
    }
}

type ActionGotoJson = ActionJson & {
    type: 'goto';
    to: string;
};

class ActionGoto extends Action {
    protected type: ActionGotoJson['type'] = 'goto';
    protected to: ActionGotoJson['to'];

    constructor(data: ActionGotoJson) {
        super(data);
        this.to = data.to;
    }

    public getTo(): ActionGoto['to'] { return this.to; }
    public setTo(to: ActionGoto['to']): this { 
        this.to = to; 
        return this; 
    }

    public toJson(): ActionGotoJson {
        return {
            ...super.toJson(),
            type: this.type,
            to: this.to
        };
    }
}

type PluginJson = {
    name: string;
    menus?: Array<MenuChoiceJson>;
    actions?: Array<ActionGotoJson | ActionFunctionJson>;
};

class Plugins {
    protected menus: Record<string, Menu>;
    protected actions: Record<string, Action>;

    constructor() {
        this.menus = {};
        this.actions = {};
    }

    public addPlugin(plugin: PluginJson): this {
        plugin.menus?.forEach(menu => this.addMenu(menu, plugin.name));
        plugin.actions?.forEach(action => this.addAction(action, plugin.name));

        return this;
    }

    public getMenus(): Plugins['menus'][string][] { return Object.values(this.menus); }
    public getMenu(name: string): Plugins['menus'][string] | undefined { return this.menus[name]; }
    public addMenu(
        menu: Exclude<PluginJson['menus'], undefined>[number] | Plugins['menus'][string],
        plugin?: string
    ): this {
        let menuInstance: Menu | undefined = undefined;
        if(menu instanceof Menu) {
            menuInstance = menu;
        } else {
            switch(menu.type) {
                case 'choice':
                    menuInstance = new MenuChoice(menu);
                    break;
            }
        }
        if(menuInstance) {
            menuInstance.setPlugin(plugin ?? menuInstance.getPlugin() ?? 'default');
            this.menus[menuInstance.getName()] = menuInstance;
        }
        return this.load();
    }

    public getActions(): Plugins['actions'][string][] { return Object.values(this.actions); }
    public getAction(name: string): Plugins['actions'][string] | undefined { 
        return this.actions[name]; 
    }
    public addAction(
        action: Exclude<PluginJson['actions'], undefined>[number] | Plugins['actions'][string],
        plugin?: string
    ): this {
        let actionInstance: Action | undefined = undefined;
        if(action instanceof Action) {
            actionInstance = action;
        } else {
            switch(action.type) {
                case 'function':
                    actionInstance = new ActionFunction(action as ActionFunctionJson);
                    break;
                case 'goto':
                    actionInstance = new ActionGoto(action as ActionGotoJson);
                    break;
            }
        }
        if(actionInstance) {
            actionInstance.setPlugin(plugin ?? actionInstance.getPlugin() ?? 'default');
            this.actions[actionInstance.getName()] = actionInstance;
        }

        return this.load();
    }

    public load(): this {
        this.getMenus().forEach(menu => {
            menu.getParents().forEach(parentName => {
                const parentMenu = this.getMenu(parentName);
                if(parentMenu && parentMenu instanceof MenuChoice) {
                    if(!parentMenu.getValue(menu.getName())) {
                        parentMenu.addValue(menu);
                    }
                }
            });
        });

        this.getActions().forEach(action => {
            action.getParents().forEach(parentName => {
                const parentMenu = this.getMenu(parentName);
                if(parentMenu && parentMenu instanceof MenuChoice) {
                    if(!parentMenu.getValue(action.getName())) {
                        parentMenu.addValue(action);
                    }
                }
            });
        });

        return this;
    }

    public async runMenuChoice(menu: MenuChoice): Promise<this> {
        const answers = await choices({
            message: `Select an action from menu "${menu.getName()}"`,
            choices: menu.getValues().map(item => item.toJson()),
        }) as string[];

        for (const answer of answers) {
            console.log(answer);
            await this.run(answer);
        }

        return this;
    }

    public async runActionFunction(action: ActionFunction): Promise<void> {
        return await action.getCallback();
    }

    public async runActionGoto(action: ActionGoto): Promise<this> {
        const item = this.getMenu(action.getTo()) ?? this.getAction(action.getTo());
        return item ? await this.run(item.getName()) : this;
    }

    public async run(name: string = 'main'): Promise<this> {
        const item = this.getMenu(name) || this.getAction(name);
        
        if(item instanceof MenuChoice) {
            return await this.runMenuChoice(item);
        } else if(item instanceof ActionFunction) {
            await this.runActionFunction(item);
        } else if(item instanceof ActionGoto) {
            return await this.runActionGoto(item);
        }

        return this;
    }

    public toJson() {
        return {
            menus: this.getMenus().map(m => m.toJson() as MenuChoiceJson),
            actions: this.getActions().map(a => a.toJson() as ActionGotoJson | ActionFunctionJson)
        };
    }
}

const plugins = new Plugins();

plugins
    .addPlugin({
        name: 'default',
        menus: [
            {
                name: 'main',
                type: 'choice',
                values: [
                    'action1'
                ]
            }
        ],
        actions: []
    })
    .addPlugin({
        name: 'test1',
        menus: [
            {
                name: 'submenu1',
                type: 'choice',
                parents: ['main'],
                values: [
                    'subaction1',
                    'submenu2'
                ]
            },
            {
                name: 'submenu2',
                type: 'choice',
                values: [
                    'subaction2',
                ]
            }
        ],
        actions: []
    })
    .addPlugin({
        name: 'test2',
        actions: [
            {
                name: 'msubmenu2',
                type: 'goto',
                to: 'submenu2',
                parents: ['main'],
            },
        ]
    })

plugins.run();