import { choices } from "@/prompts/Choices";
import { Action } from "../action";

type ModeType = 'input' | 'choices';

type MenuParent = Menu | Action | string;

type MenuConfig = {
    plugin?: string;
    mode: ModeType;
    name: string;
    parents?: MenuParent[];
    from?: string;
}


type MenuOptions = { 
    from?: Menu;
    options?: Record<string, any>;
    getGlobalActions: () => Action[];
    findMenu: (name: string) => (Menu | undefined);
    findAction: (name: string) => (Action | undefined);
    //[key: string]: any; 
};

abstract class Menu {
    protected abstract mode: ModeType;
    protected plugin?: string;
    protected name: string;
    protected parents: MenuParent[];
    protected from?: Menu;

    public constructor(config: MenuConfig) {
        this.plugin = config.plugin;
        this.name = config.name;
        this.parents = config.parents ?? [];
    }

    public getPlugin(): string | undefined { return this.plugin; }

    public getMode(): ModeType { return this.mode; }

    public getName(): string { return this.name; }

    public getParents(): MenuParent[] { return this.parents; }
    public getStringParents(): string[] { 
        return this.parents.map(p => (typeof p === 'string' ? p : p.getName())); 
    }
    public findParent(parent: MenuParent): MenuParent | undefined { 
        if(typeof parent !== 'string') {
            parent = parent.getName();
        }

        return this.getParents().find(p => {
            if(typeof p === 'string') {
                return p === parent ? p : undefined;
            } else {
                return p.getName() == parent ? p : undefined;
            }
        });
    }
    public isParentSet(parent: string): boolean { return typeof this.findParent(parent) !== 'string'; }
    public getParent(parent: string): Menu | Action | undefined {
        const item = this.findParent(parent);
        return typeof item !== 'string' ? item : undefined;
    }
    public addParent(parent: MenuParent): this { 
        const item = this.findParent(parent);
        if(item) {
            if(typeof item === 'string' && typeof parent !== 'string') {
                this.parents.splice(this.parents.indexOf(item), 1, parent);
            }
        } else {
            this.parents?.push(parent); 
        }
        return this; 
    }

    public getFrom(): Menu | undefined { return this.from; }
    public setFrom(from: Menu): this { this.from = from; return this; }

    public toObject(): MenuConfig {
        return {
            mode: this.getMode(),
            name: this.getName(),
            plugin: this.getPlugin(),
            from: this.getFrom()?.getName(),
            parents: this.getParents().map(parent => {
                if(typeof parent === 'string')  {
                    return parent;
                } else {
                    return parent.getName()
                }
            }),
        };
    }

    public clone(): this {
        const Constructor = this.constructor as new (config: MenuConfig) => this;
        return new Constructor(this.toObject());
    }

    public async print(options?: MenuOptions): Promise<unknown> {
        const menu = this.clone();
        if(!this.getFrom()) {
            menu.setFrom(this.getFrom()!);
        }
        return menu;
    };
}

export {
    Menu,
    type ModeType,
    type MenuConfig,
    type MenuOptions
}