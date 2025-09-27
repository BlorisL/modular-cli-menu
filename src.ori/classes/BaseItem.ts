import { ColorName } from "chalk";

interface BaseItemType {
    plugin: string;
    name: string;
    index?: number;
    message?: string;
    color?: ColorName;
}

abstract class BaseItem<TMode> {
    protected plugin: string;
    protected abstract mode: TMode;
    protected name: string;
    protected index?: number;
    protected message?: string;
    protected color?: ColorName;

    public constructor(params: BaseItemType & { mode: TMode }) {
        this.plugin = params.plugin;
        this.name = params.name;
        this.index = params.index;
        this.message = params.message;
        this.color = params.color;
    }

    protected abstract getType(): string;

    public getMode(): TMode { return this.mode; }

    public getPlugin(): string { return this.plugin; }
    public setPlugin(plugin: string): this { this.plugin = plugin; return this; }
    
    public getName(): string { return this.name; }
    public setName(name: string): this { this.name = name; return this; }

    public getIndex(): number | undefined { return this.index; }
    public setIndex(index: number): this { this.index = index; return this; }

    public getMessage(): string | undefined { return this.message; }
    public setMessage(message: string): this { this.message = message; return this; }

    public getColor(): ColorName | undefined { return this.color; }
    public setColor(color: ColorName): this { this.color = color; return this; }

    public getNameTranslation(): string {
        if (this.getType() === 'menu') {
            return `${this.getPlugin()}.menu.${this.getName()}.question`;
        } else {
            const msg = this.getMessage();
            return (msg && msg.length > 0) ? msg : `action.${this.getName()}.label`;
        }
    }

    public getMessageTranslation(): string {
        if (this.getType() === 'menu') {
            return `${this.getPlugin()}.${this.getType()}.${this.getMessage()}.message`;
        } else {
            const msg = this.getMessage();
            return (msg && msg.length > 0) ? msg : `action.${this.getName()}.message`;
        }
    }

    public abstract toObject(): BaseItemType & { mode: TMode };
}

export {
    BaseItem,
    type BaseItemType
};