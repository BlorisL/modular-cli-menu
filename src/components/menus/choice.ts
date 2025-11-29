import { choices } from "@/prompts/Choices";
import { Menu, MenuJson } from "./menu";
import { Action } from "../actions";


type MenuChoiceValueJson = {
    name: string;
    value: string;
    multi?: boolean;
};

class MenuChoiceValue {
    public name: MenuChoiceValueJson['name'];
    public value: MenuChoiceValueJson['value'];
    public multi: Exclude<MenuChoiceValueJson['multi'], undefined>;

    constructor(name: string, value?: MenuChoiceValueJson['value'], multi?: boolean) {
        this.name = name;
        this.value = value ?? name;
        this.multi = multi ?? false;
    }

    public getName(): MenuChoiceValue['name'] { return this.name; }

    public getValue(): MenuChoiceValue['value'] { return this.value; }
    public setValue(value: MenuChoiceValue['value']): this { 
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

    public isMulti(): MenuChoiceValue['multi'] { return this.multi === true; }

    public toJson() {
        return {
            name: this.name,
            value: this.value, //typeof this.value === 'string' ? this.value : this.value.getName(),
            multi: this.multi
        };
    }
}

type MenuChoiceJson = MenuJson & {
    type: 'choice';
    values?: Array<string | MenuChoiceValueJson>;
};

class MenuChoice extends Menu {
    protected type: MenuChoiceJson['type'] = 'choice';
    protected values: Record<string, MenuChoiceValue> = {};

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
            this.values[value.getName()] = new MenuChoiceValue(value.getName());
        } else if(value instanceof MenuChoiceValue) {
            this.values[value.getName()] = value;
        } else if(typeof value === 'string') {
            this.values[value] = new MenuChoiceValue(value);
        } else if(!!value) {
            this.values[value.name] = new MenuChoiceValue(value.name, value.value, value.multi);
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
        return await choices({
            message: `Select an action from menu "${this.getName()}"`,
            choices: this.getValues().map(item => item.toJson()),
        }) as string[];
    }
}

export { MenuChoice, type MenuChoiceJson, MenuChoiceValue, type MenuChoiceValueJson };