import { choices, Separator } from "@/prompts/Choices";
import { Menu, MenuJson } from "./menu";
import { Action } from "../actions";
import chalk, { ColorName } from "chalk";
import { Language, Translations } from "../translations";


type MenuChoiceOptionJson = {
    value: string;
    label?: string;
    multi?: boolean;
    color?: ColorName;
};

class MenuChoiceOption {
    protected value: MenuChoiceOptionJson['value'] | Menu | Action;
    protected label: Exclude<MenuChoiceOptionJson['label'], undefined>;
    protected multi: Exclude<MenuChoiceOptionJson['multi'], undefined>;
    protected color?: MenuChoiceOptionJson['color'];

    constructor(
        value: MenuChoiceOptionJson['value'] | Menu | Action, 
        label?: MenuChoiceOptionJson['label'], 
        multi?: MenuChoiceOptionJson['multi'], 
        color?: MenuChoiceOptionJson['color']
    ) {
        this.value = value;
        this.label = label ?? (typeof value === 'string' ? value : value.getName());
        this.multi = multi ?? false;
        this.color = color;
    }

    public getValue(): string { 
        return typeof this.value === 'string' ? this.value : this.value.getName();
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

    public getLabel(): MenuChoiceOption['label'] { 
        const color = this.getColor();
        return color ? chalk[color](this.label) : this.label; 
    }

    public getColor(): MenuChoiceOption['color'] | undefined { return this.color; }
    public setColor(color: MenuChoiceOption['color']): this { this.color = color; return this; }

    public isMulti(): MenuChoiceOption['multi'] { return this.multi === true; }

    public getIndex(): number | undefined {
        return typeof this.value === 'string' ? undefined : this.value.getIndex();
    }

    public getItem(): Exclude<MenuChoiceOption['value'], string> | undefined { 
        return typeof this.value === 'string' ? undefined : this.value; 
    }
    public getTranslationLabel(language?: Language): string {
        return this.getItem()?.getTitleLabel(language) 
            ?? Translations.getTranslation(this.getValue(), language)
        ;
    }

    public toJson() {
        return {
            value: this.getValue(), 
            label: this.getLabel(), //typeof this.value === 'string' ? this.value : this.value.getName(),
            multi: this.isMulti(),
            color: this.getColor()
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

    public getValues(): MenuChoice['values'][string][] { return this.sortValues(); }
    public getValue(name: string): MenuChoice['values'][string] | undefined { 
        return this.values[name]; 
    }

    protected sortValues(): MenuChoice['values'][string][] {
        return Object.values(this.values).sort((a, b) => {
            const aItem = a.getItem();
            const bItem = b.getItem();
            
            const aIsGlobal = aItem instanceof Action && aItem.isGlobal();
            const bIsGlobal = bItem instanceof Action && bItem.isGlobal();
            
            // Azioni globali sempre in fondo
            if(aIsGlobal && !bIsGlobal) return 1;
            if(!aIsGlobal && bIsGlobal) return -1;
            
            // Se entrambe globali, ordina per indice
            if(aIsGlobal && bIsGlobal) {
                const aIndex = aItem instanceof Action ? (aItem.getIndex() ?? Infinity) : Infinity;
                const bIndex = bItem instanceof Action ? (bItem.getIndex() ?? Infinity) : Infinity;
                return aIndex - bIndex;
            }
            
            // Per non-globali: ordina prima per indice
            const aIndex = aItem ? (aItem.getIndex() ?? Infinity) : Infinity;
            const bIndex = bItem ? (bItem.getIndex() ?? Infinity) : Infinity;
            
            if(aIndex !== bIndex) return aIndex - bIndex;
            
            // Se stesso indice: azioni prima, poi menu
            const aIsAction = aItem instanceof Action;
            const bIsAction = bItem instanceof Action;
            
            if(aIsAction && !bIsAction) return -1;
            if(!aIsAction && bIsAction) return 1;
            
            // Se stesso tipo e indice: ordinamento alfabetico
            const aName = aItem ? aItem.getName() : a.getValue();
            const bName = bItem ? bItem.getName() : b.getValue();
            
            return aName.localeCompare(bName);
        });
    }

    public addValue(
        value: Menu | Action | MenuChoice['values'][string] | Exclude<MenuChoiceJson['values'], undefined>[number]
    ): this {
        if(value instanceof Menu || value instanceof Action) {
            this.values[value.getName()] = new MenuChoiceOption(
                value,
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
        console.clear();

        const values: Array<MenuChoiceOption | Separator> = this.getValues();
        
        const globalIndex = this.getValues().findIndex(v => {
            const item = v.getItem();
            return item instanceof Action && item.isGlobal();
        });

        values.splice(globalIndex, 0, new Separator());

        return await choices({
            message: this.getQuestionLabel(),
            choices: values.map(choice => {
                return choice instanceof Separator ? choice : {
                    ...choice.toJson(),
                    label: choice.getTranslationLabel()
                };
            }),
        }) as string[];
    }
}

export { MenuChoice, type MenuChoiceJson, MenuChoiceOption, type MenuChoiceOptionJson };