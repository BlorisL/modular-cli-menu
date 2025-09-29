import { choices } from "@/prompts/Choices";
import { Action } from "../action";

type ModeType = 'input' | 'choices';

type MenuConfig = {
    mode: ModeType;
    name: string;
    //parent?: string;
}

abstract class Menu {
    protected abstract mode: ModeType;
    protected name: string;
    protected parent?: Menu | Action;

    public constructor(config: MenuConfig) {
        this.name = config.name;
    }

    public getMode(): ModeType { return this.mode; }

    public getName(): string { return this.name; }

    public getParent(): Menu | Action | undefined { return this.parent; }
    public setParent(parent: Menu | Action): this { this.parent = parent; return this; }

    public abstract print(): Promise<unknown>;
}

export {
    Menu,
    type ModeType,
    type MenuConfig
}