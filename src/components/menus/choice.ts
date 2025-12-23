import { choices, Separator } from "@/prompts/Choices";
import { Menu, MenuJson } from "./menu";
import { Action } from "../actions";
import chalk, { ColorName } from "chalk";
import { Language, Translations } from "../translations";
import { Utility } from "../utility";

type MenuChoiceOptionSelectedJson = {
    prefix?: string;
    color?: ColorName;
};

class MenuChoiceOptionSelected {
    protected prefix: MenuChoiceOptionSelectedJson['prefix'];
    protected color?: MenuChoiceOptionSelectedJson['color'];

    constructor(
        prefix?: MenuChoiceOptionSelectedJson['prefix'], 
        color?: MenuChoiceOptionSelectedJson['color']
    ) {
        this.prefix = prefix;
        this.color = color;
    }

    public getPrefix(): MenuChoiceOptionSelected['prefix'] { return this.prefix; }
    public setPrefix(prefix: MenuChoiceOptionSelected['prefix']): this { 
        if(prefix && prefix?.length > 0) {
            this.prefix = prefix; 
        }

        return this; 
    }

    public getColor(): MenuChoiceOptionSelected['color'] | undefined { return this.color; }
    public setColor(color: MenuChoiceOptionSelected['color']): this { this.color = color; return this; }
}

type MenuChoiceOptionJson = {
    value: string;
    label?: string;
    multi?: boolean;
    color?: ColorName;
    selected?: MenuChoiceOptionSelectedJson;
};

class MenuChoiceOption {
    protected value: MenuChoiceOptionJson['value'] | Menu | Action;
    protected label: Exclude<MenuChoiceOptionJson['label'], undefined>;
    protected multi: Exclude<MenuChoiceOptionJson['multi'], undefined>;
    protected color?: MenuChoiceOptionJson['color'];
    protected selected?: MenuChoiceOptionSelected;

    constructor(
        value: MenuChoiceOptionJson['value'] | Menu | Action, 
        label?: MenuChoiceOptionJson['label'], 
        multi?: MenuChoiceOptionJson['multi'], 
        color?: MenuChoiceOptionJson['color'],
        selected?: MenuChoiceOptionSelectedJson
    ) {
        this.value = value;
        this.label = label ?? (typeof value === 'string' ? value : value.getName());
        this.multi = multi ?? false;
        this.color = color;
        this.selected = selected ? new MenuChoiceOptionSelected(
            selected.prefix,
            selected.color
        ) : undefined;
    }

    public getValue(): string { 
        return typeof this.value === 'string' ? this.value : this.value.getName();
    }
    public setValue(value: MenuChoiceOption['value']): this { this.value = value; return this; }

    public getLabel(): MenuChoiceOption['label'] { 
        let label = this.label;
        if(this.getSelected()?.getPrefix()) {
            label = `${this.getSelected()?.getPrefix()} ${label}`;
        }
        const color = this.getSelected()?.getColor() ?? this.getColor();

        return color ? chalk[color](label) : label; 
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
            ?? Translations.getTranslation(this.getLabel() ?? this.getValue(), language)
        ;
    }

    public getSelected(): MenuChoiceOptionSelected | undefined { return this.selected; }

    public getSelectedPrefix(): string | undefined { return this.selected?.getPrefix(); }
    public setSelectedPrefix(prefix?: string): this { this.selected?.setPrefix(prefix); return this; }
    public getSelectedColor(): ColorName | undefined { return this.selected?.getColor(); }
    public setSelectedColor(color?: ColorName): this { this.selected?.setColor(color); return this; }

    public toJson() {
        const item: {
            value: MenuChoiceOptionJson['value'];
            label: MenuChoiceOptionJson['label'];
            multi: Exclude<MenuChoiceOptionJson['multi'], undefined>;
            //color?: MenuChoiceOptionJson['color'];
            //selected?: MenuChoiceOptionSelectedJson;
        } = {
            value: this.getValue(), 
            label: this.getLabel(), //typeof this.value === 'string' ? this.value : this.value.getName(),
            multi: this.isMulti(),
            //color: this.getColor(),
        };
        //if(this.selected) {
        //    item.selected = {
        //        prefix: this.getSelectedPrefix(),
        //        color: this.getSelectedColor()
        //    };
        //}
        return item;
    }
}

type MenuChoiceJsonValue = string | MenuChoiceOptionJson;

type MenuChoiceJson = MenuJson & {
    type: 'choice';
    values?: Array<MenuChoiceJsonValue> | (() => Array<MenuChoiceJsonValue>);
    enableSelectedValues?: boolean | MenuChoiceOptionSelectedJson;
};

type MenuChoiceValues = Record<string, MenuChoiceOption>;

class MenuChoice extends Menu {
    protected type: MenuChoiceJson['type'] = 'choice';
    protected values: MenuChoiceValues | (() => MenuChoiceValues) = {};
    protected selectedValues: string[] = [];

    protected enableSelectedValues: Exclude<MenuChoiceJson['enableSelectedValues'], undefined> = false;

    constructor(data: MenuChoiceJson) {
        super(data);
        this.enableSelectedValues = data.enableSelectedValues ?? false;
        
        if(Array.isArray(data.values)) {
            data.values.forEach(v => this.addValue(v));
        } else if(typeof data.values === 'function') {
            this.values = () => {
                const result: MenuChoiceValues = {};
                (data.values as Function)().forEach((v: MenuChoiceJsonValue) => {
                    if(typeof v === 'string') {
                        result[v] = new MenuChoiceOption(v);
                    } else {
                        result[v.value] = new MenuChoiceOption(v.value, v.label, v.multi, v.color, v.selected);
                    }
                });
                return result;
            };
        }
    }

    public getValues(): MenuChoiceValues[string][] { return this.sortValues(); }
    protected sortValues(): MenuChoiceValues[string][] {
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

    public getValue(name: string): MenuChoiceValues[string] | undefined { 
        return (typeof this.values === 'function') ? this.values()[name] : this.values[name]; 
    }
    public setValue(name: string, value: MenuChoiceValues[string]): this { 
        if(this.enableSelectedValues) {
            if(typeof this.enableSelectedValues === 'boolean') {
                if(this.enableSelectedValues) {
                    value.setSelectedPrefix(Utility.getDefaultLanguagePrefix());
                    value.setSelectedColor(Utility.getDefaultLanguageColor());
                }
            } else {
                value.setSelectedPrefix(this.enableSelectedValues.prefix ?? Utility.getDefaultLanguagePrefix());
                value.setSelectedColor(this.enableSelectedValues.color ?? Utility.getDefaultLanguageColor());
            }
        }
        
        if(typeof this.values === 'function') {
            const vals = this.values();
            vals[name] = value;
            this.values = vals;
        } else {
            this.values[name] = value; 
        }
        return this; 
    }
    public addValue(
        value: Menu | Action | MenuChoiceOption | MenuChoiceJsonValue
    ): this {
        if(value instanceof Menu || value instanceof Action) {
            this.setValue(value.getName(), new MenuChoiceOption(
                value,
                value.getName(),
                false,
                value.getColor()
            ));
        } else if(value instanceof MenuChoiceOption) {
            this.setValue(value.getValue(), value);
        } else if(typeof value === 'string') {
            this.setValue(value, new MenuChoiceOption(value));
        } else if(!!value) {
            this.setValue(value.value, new MenuChoiceOption(
                value.value, 
                value.label, 
                value.multi, 
                value.color
            ));
        }
        return this;
    }

    public isEnableSelectedValues(): MenuChoice['enableSelectedValues'] { return !!this.enableSelectedValues; }

    public setSelectedValues(values: string[]): this { this.selectedValues = values; return this; }
    public getSelectedValues(): string[] { return this.selectedValues; }
    public addSelectedValue(value: string): this { 
        if(!this.selectedValues.includes(value)) {
            this.selectedValues.push(value); 
        }
        return this; 
    }
    public delSelectedValue(value: string): this { 
        this.selectedValues = this.selectedValues.filter(v => v !== value); 
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
            return item?.isGlobal();
        });

        values.splice(globalIndex, 0, new Separator());

        this.setSelectedValues(await choices({
            message: this.getQuestionLabel(),
            choices: values.map(choice => {
                if(!(choice instanceof Separator)) {
                    console.log(choice.getTranslationLabel());
                }
                return choice instanceof Separator ? choice : {
                    ...choice.toJson(),
                    label: choice.getTranslationLabel()
                };
            }),
        }) as string[]);

        return this.getSelectedValues();
    }
}

export { MenuChoice, type MenuChoiceJson, MenuChoiceOption, type MenuChoiceOptionJson };