import { Menu } from "../menu";

type ModeType = 'function' | 'goto';

type ActionConfig = {
    plugin?: string;
    mode: ModeType;
    name: string;
    global?: boolean;
    parent?: string;
}
type ActionOptions = { 
    from?: Menu;
    options?: Record<string, any>;
    getGlobalActions?: () => Action[];
    findMenu: (name: string) => Menu | undefined;
    findAction: (name: string) => Action | undefined;
    //[key: string]: any; 
};

abstract class Action {
    protected abstract mode: ModeType;
    protected plugin?: string;
    protected name: string;
    protected parent?: Menu | Action | string;
    protected global: boolean;
    protected from?: Menu;

    public constructor(config: ActionConfig) {
        this.plugin = config.plugin;
        this.name = config.name;
        this.global = config.global ?? false;
        this.parent = config.parent;
    }

    public getPlugin(): string | undefined { return this.plugin; }

    public getMode(): ModeType { return this.mode; }

    public getName(): string { return this.name; }

    public getParent(): Menu | Action | undefined { 
        return ((typeof this.parent) === 'string') ? undefined : this.parent; 
    }
    public setParent(parent: Menu | Action): this { this.parent = parent; return this; }

    public getFrom(): Menu | undefined { return this.from; }
    public setFrom(from: Menu): this { this.from = from; return this; }

    public isGlobal(): boolean { return this.global; }
    
    public toObject(): ActionConfig {
        return {
            mode: this.getMode(),
            name: this.getName(),
            //parent: this.getParent()?.getName(),
        };
    }

    public clone(): this {
        const Constructor = this.constructor as new (config: ActionConfig) => this;
        return new Constructor(this.toObject());
    }
    
    public async run(options?: ActionOptions): Promise<unknown> {
        const action = this.clone();
        if(options?.from) {
            action.setFrom(options.from);
        }

        return action;
    };

}

export {
    Action,
    type ModeType,
    type ActionConfig,
    type ActionOptions
}