import { Menu } from "../menu";

type ModeType = 'function' | 'goto';

type ActionConfig = {
    mode: ModeType;
    name: string;
    global?: boolean;
    parent?: string;
}
type ActionOptions = { [key: string]: any; };

abstract class Action {
    protected abstract mode: ModeType;
    protected name: string;
    protected parent?: Menu | Action | string;
    protected global: boolean;

    public constructor(config: ActionConfig) {
        this.name = config.name;
        this.global = config.global ?? false;
        this.parent = config.parent;
    }

    public getMode(): ModeType { return this.mode; }

    public getName(): string { return this.name; }

    public getParent(): Menu | Action | undefined { 
        return ((typeof this.parent) === 'string') ? undefined : this.parent; 
    }
    public setParent(parent: Menu | Action): this { this.parent = parent; return this; }

    public isGlobal(): boolean { return this.global; }

    public abstract run(options: ActionOptions): Promise<unknown>;
}

export {
    Action,
    type ModeType,
    type ActionConfig,
    type ActionOptions
}