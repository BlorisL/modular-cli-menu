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

    public abstract run(): Promise<unknown>;
}

export { Menu, type MenuJson };