import { choices } from "@/prompts/Choices";
import { Menu, MenuJson } from "./menu";
import { Action } from "../actions";
import chalk, { ColorName } from "chalk";


type MenuChoiceOptionJson = {
    value: string;
    label?: string;
    multi?: boolean;
    color?: ColorName;
};

class MenuChoiceOption {
    protected value: MenuChoiceOptionJson['value'];
    protected label: MenuChoiceOptionJson['label'];
    protected multi: Exclude<MenuChoiceOptionJson['multi'], undefined>;
    protected color?: MenuChoiceOptionJson['color'];

    constructor(
        value: MenuChoiceOptionJson['value'], 
        label?: MenuChoiceOptionJson['label'], 
        multi?: MenuChoiceOptionJson['multi'], 
        color?: MenuChoiceOptionJson['color']
    ) {
        this.value = value;
        this.label = label ?? value;
        this.multi = multi ?? false;
        this.color = color;
    }

    public getValue(): MenuChoiceOption['value'] { return this.value; }

    public getLabel(): MenuChoiceOption['label'] { 
        const color = this.getColor();
        return color ? chalk[color](this.label) : this.label; 
    }
    public setValue(value: MenuChoiceOption['value']): this { 
        this.value = value; 
        /*if(value instanceof MenuChoice) {
            this.value = new MenuChoice(
                value.getName(), 
                value.getValues(), 
                value.getPlugin(), 
                value.getParents()
            );
        } else if(value instanceof ActionFunction) {
            this.value = new ActionFunction(
                value.getName(), 
                value.getCallback(), 
                value.getPlugin(), 
                value.isGlobal(), 
                value.getParents()
            );
        } else if(value instanceof ActionGoto) {
            this.value = new ActionGoto(
                value.getName(), 
                value.getTo(), 
                value.getPlugin(), 
                value.isGlobal(), 
                value.getParents()
            );
        } else {
            this.value = value;
        }*/
        return this; 
    }

    public getColor(): MenuChoiceOption['color'] | undefined { return this.color; }
    public setColor(color: MenuChoiceOption['color']): this { this.color = color; return this; }

    public isMulti(): MenuChoiceOption['multi'] { return this.multi === true; }

    public toJson() {
        return {
            value: this.value, 
            label: this.label, //typeof this.value === 'string' ? this.value : this.value.getName(),
            multi: this.multi,
            color: this.color
        };
    }
}

type MenuChoiceJson = MenuJson & {
    type: 'choice';
    values?: Array<string | MenuChoiceOptionJson>;
};

class MenuChoice extends Menu {
    protected type: MenuChoiceJson['type'] = 'choice';
    protected values: Record<string, MenuChoiceOption> = {};

    constructor(data: MenuChoiceJson) {
        super(data);
        
        if(data.values) {
            data.values.forEach(v => this.addValue(v));
        }
    }

    public getValues(): MenuChoice['values'][string][] { return Object.values(this.values); }
    public getValue(name: string): MenuChoice['values'][string] | undefined { 
        return this.values[name]; 
    }
    public addValue(
        value: Menu | Action | MenuChoice['values'][string] | Exclude<MenuChoiceJson['values'], undefined>[number]
    ): this {
        if(value instanceof Menu || value instanceof Action) {
            this.values[value.getName()] = new MenuChoiceOption(
                value.getName(),
                value.getName(),
                false,
                value.getColor()
            );
        } else if(value instanceof MenuChoiceOption) {
            this.values[value.getValue()] = value;
        } else if(typeof value === 'string') {
            this.values[value] = new MenuChoiceOption(value);
        } else if(!!value) {
            this.values[value.value] = new MenuChoiceOption(
                value.value, 
                value.label, 
                value.multi, 
                value.color
            );
        }
        return this;
    }

    public toJson(): MenuChoiceJson {
        return {
            ...super.toJson(),
            type: this.type,
            values: Object.values(this.values).map(v => v.toJson())
        };
    }

    public async run(): Promise<string[]> {
        const color = this.getColor();
        return await choices({
            message: color
                ? chalk[color](`Select an action from menu "${this.getName()}"`)
                : `Select an action from menu "${this.getName()}"`
            ,
            choices: this.getValues().map(item => item.toJson()),
        }) as string[];
    }
}

export { MenuChoice, type MenuChoiceJson, MenuChoiceOption, type MenuChoiceOptionJson };