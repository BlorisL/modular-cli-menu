import { ColorName } from "chalk";

type MenuChoiceConfigSelectedJson = {
    prefix?: string;
    color?: ColorName;
};

class MenuChoiceConfigSelected {
    protected prefix: MenuChoiceConfigSelectedJson['prefix'];
    protected color?: MenuChoiceConfigSelectedJson['color'];

    constructor(
        prefix?: MenuChoiceConfigSelectedJson['prefix'], 
        color?: MenuChoiceConfigSelectedJson['color']
    ) {
        this.prefix = prefix;
        this.color = color;
    }

    public getPrefix(): MenuChoiceConfigSelected['prefix'] { return this.prefix; }
    public setPrefix(prefix: MenuChoiceConfigSelected['prefix']): this { 
        if(prefix && prefix?.length > 0) {
            this.prefix = prefix; 
        }

        return this; 
    }

    public getColor(): MenuChoiceConfigSelected['color'] | undefined { return this.color; }
    public setColor(color: MenuChoiceConfigSelected['color']): this { this.color = color; return this; }
}

export { 
    type MenuChoiceConfigSelectedJson, 
    MenuChoiceConfigSelected 
};