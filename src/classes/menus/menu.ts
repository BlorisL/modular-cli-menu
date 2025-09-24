import { ColorName } from "chalk";

type MenuTypes = 'input' | 'choices';

type MenuType = {
    plugin: string;
    mode: MenuTypes;
    name: string;
    parent?: string;
    index?: number;
    message?: string;
    color?: ColorName;
};

abstract class Menu {
    protected plugin: MenuType['plugin'];
    protected mode: MenuType['mode'];
    protected name: MenuType['name'];
    protected parent: MenuType['parent'];
    protected index?: MenuType['index'];
    protected message?: MenuType['message'];
    protected color?: MenuType['color'];

    public constructor(params: MenuType) {
        this.plugin = params.plugin;
        this.mode = params.mode;
        this.name = params.name;
        this.parent = params.parent;
        this.index = params.index ?? undefined;
        this.message = params.message ?? undefined;
        this.color = params.color ?? undefined;
    }

    public getPlugin(): MenuType['plugin'] { return this.plugin; }

    public getMode(): MenuType['mode'] { return this.mode; }
    public setMode(mode: MenuType['mode']): this { this.mode = mode; return this; }

    public getName(): MenuType['name'] { return this.name; }
    public setName(name: MenuType['name']): this { this.name = name; return this; }

    public getParent(): MenuType['parent'] { return this.parent; }
    public setParent(parent: MenuType['parent']): this { this.parent = parent; return this; }

    public getIndex(): MenuType['index'] | undefined { return this.index; }
    public setIndex(index: MenuType['index']): this { this.index = index; return this; }

    public getMessage(): MenuType['message'] | undefined { return this.message; }
    public setMessage(message: MenuType['message']): this { this.message = message; return this; }

    public getColor(): MenuType['color'] | undefined { return this.color; }
    public setColor(color: MenuType['color']): this { this.color = color; return this; }

    public getNameTranslation(): string { return `${this.getPlugin()}.menu.${this.getName()}.question`; }
    public getMessageTranslation(): string { 
        return `${this.getPlugin()}.menu.${this.getMessage()}.message`;
    }

    public abstract call(...args: unknown[]): Promise<unknown>;
}

export { 
    Menu,
    type MenuTypes,
    type MenuType
};