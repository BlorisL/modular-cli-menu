import { ColorName } from "chalk";

type ItemType = {
    mode: string;
    name: string;
    index?: number;
    message?: string;
    color?: ColorName;
};

export abstract class Item<T extends ItemType = ItemType> {
    protected mode: T['mode'];
    protected name: T['name'];
    protected index?: T['index'];
    protected message?: T['message'];
    protected color?: T['color'];

    public constructor(params: T) {
        this.mode = params.mode;
        this.name = params.name;
        this.index = params.index ?? undefined;
        this.message = params.message ?? undefined;
        this.color = params.color ?? undefined;
    }

    public getMode(): T['mode'] { return this.mode; }
    public setMode(mode: T['mode']): this { this.mode = mode; return this; }

    public getName(): T['name'] { return this.name; }
    public setName(name: T['name']): this { this.name = name; return this; }

    public getIndex(): T['index'] | undefined { return this.index; }
    public setIndex(index: T['index']): this { this.index = index; return this; }

    public getMessage(): T['message'] | undefined { return this.message; }
    public setMessage(message: T['message']): this { this.message = message; return this; }

    public getColor(): T['color'] | undefined { return this.color; }
    public setColor(color: T['color']): this { this.color = color; return this; }

    public abstract getNameTranslation(): string;
    public abstract getMessageTranslation(): string;
}
