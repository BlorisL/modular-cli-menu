import { ColorName } from 'chalk';

type MenuFieldConfigSelectedJson = {
    prefix?: string;
    color?: ColorName;
};

class MenuFieldConfigSelected {
    protected prefix: MenuFieldConfigSelectedJson['prefix'];
    protected color?: MenuFieldConfigSelectedJson['color'];

    constructor(
        prefix?: MenuFieldConfigSelectedJson['prefix'],
        color?: MenuFieldConfigSelectedJson['color']
    ) {
        this.prefix = prefix;
        this.color  = color;
    }

    public getPrefix(): MenuFieldConfigSelected['prefix'] { return this.prefix; }
    public setPrefix(prefix: MenuFieldConfigSelected['prefix']): this {
        if (prefix && prefix.length > 0) this.prefix = prefix;
        return this;
    }

    public getColor(): MenuFieldConfigSelected['color'] | undefined { return this.color; }
    public setColor(color: MenuFieldConfigSelected['color']): this { this.color = color; return this; }
}

export { type MenuFieldConfigSelectedJson, MenuFieldConfigSelected };