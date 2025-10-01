import { choices } from "@/prompts/Choices";
import { Action } from "../action";

type ModeType = 'input' | 'choices';

type MenuConfig = {
    mode: ModeType;
    name: string;
    parent?: string;
}
type MenuOptions = { [key: string]: any; };

abstract class Menu {
    protected abstract mode: ModeType;
    protected name: string;
    protected parent?: Menu | Action | string;

    public constructor(config: MenuConfig) {
        this.name = config.name;
        this.parent = config.parent;
    }

    public getMode(): ModeType { return this.mode; }

    public getName(): string { return this.name; }

    public isParentSet(): boolean { return (typeof this.parent) !== 'string'; }
    public getRawParent(): string | Menu | Action | undefined { return this.parent; }
    public getParent(): Menu | Action | undefined { 
        return this.isParentSet() ? (this.parent as Menu | Action) : undefined; 
    }
    public setParent(parent: Menu | Action): this { this.parent = parent; return this; }

    public abstract print(options: MenuOptions): Promise<unknown>;
}

export {
    Menu,
    type ModeType,
    type MenuConfig,
    type MenuOptions
}