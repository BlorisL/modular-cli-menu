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

    public abstract run(): Promise<unknown>;
}

export { Action, ActionJson };