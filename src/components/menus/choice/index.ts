import { choices, Separator } from "@/prompts/Choices";
import { Menu, MenuJson } from "../menu";
import { Action } from "../../actions";
import { Utility } from "../../utility";
import { MenuChoiceOption, MenuChoiceOptionJson } from "./option";
import { MenuChoiceConfigs, MenuChoiceConfigsJson } from "./configs";


type MenuChoiceJsonValue = string | MenuChoiceOptionJson;

type MenuChoiceJson = MenuJson & {
    type: 'choice';
    values?: Array<MenuChoiceJsonValue> | ((data: { menu: MenuChoice }) => Array<MenuChoiceJsonValue>);
    configs?: MenuChoiceConfigsJson;
};

type MenuChoiceValues = Record<string, MenuChoiceOption>;

class MenuChoice extends Menu {
    protected type: MenuChoiceJson['type'] = 'choice';
    protected values: MenuChoiceValues | ((data: { menu: MenuChoice }) => MenuChoiceValues) = {};
    protected selectedValues: string[] = [];

    protected configs?: MenuChoiceConfigs = undefined;

    constructor(data: MenuChoiceJson) {
        super(data);
        this.setConfigs(data.configs).setSelectedValues(this.getConfigs()?.getDefaults()?.getValues() ?? []);
        
        if(Array.isArray(data.values)) {
            data.values.forEach(v => this.addValue(v));
        } else if(typeof data.values === 'function') {
            (data.values as Function)({ menu: this }).forEach((v: MenuChoiceJsonValue) => this.addValue(v));
        }
    }

    public getValues(): MenuChoiceValues[string][] { return this.sortValues(); }
    protected sortValues(): MenuChoiceValues[string][] {
        return Object.values(this.values).sort((a, b) => {
            const aItem = a.getItem();
            const bItem = b.getItem();
            
            const aIsGlobal = aItem?.isGlobal();
            const bIsGlobal = bItem?.isGlobal();
            
            // Azioni globali sempre in fondo
            if(aIsGlobal && !bIsGlobal) return 1;
            if(!aIsGlobal && bIsGlobal) return -1;
            
            // Se entrambe globali, ordina per indice
            if(aIsGlobal && bIsGlobal) {
                // Se entrambe globali: ordina prima per indice
                const aIndex = aItem?.getIndex() ?? Infinity;
                const bIndex = bItem?.getIndex() ?? Infinity;
                
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
        return (typeof this.values === 'function') ? this.values({ menu: this })[name] : this.values[name]; 
    }
    public setValue(name: string, value: MenuChoiceValues[string]): this { 
        if(typeof this.values === 'function') {
            const vals = this.values({ menu: this });
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
        let name: string | undefined = undefined;
        let option: MenuChoiceOption | undefined = undefined;

        if(value instanceof Menu || value instanceof Action) {
            name = value.getName();
            option = new MenuChoiceOption(
                value,
                value.getName(),
                false,
                value.getColor(),
            );
        } else if(value instanceof MenuChoiceOption) {
            name = value.getValue();
            option = value;
        } else if(typeof value === 'string') {
            name = value;
            option = new MenuChoiceOption(value);
        } else if(typeof value === 'object') {
            name = value.value;
            option = new MenuChoiceOption(
                value.value, 
                value.label, 
                value.multi, 
                value.color,
                value.selected
            );
        }

        if(name && option) {
            if(this.isConfigSelected()) {
                if(!option.getSelected()) {
                    const prefix = this.getConfigs()?.getSelected()?.getPrefix() ?? Utility.getDefaultPrefix();
                    const color = this.getConfigs()?.getSelected()?.getColor() ?? Utility.getDefaultColor();

                    option.setSelectedPrefix(prefix);
                    option.setSelectedColor(color);
                } else {
                    if(!option.getSelectedPrefix()) {
                        option.setSelectedPrefix(this.getConfigs()?.getSelected()?.getPrefix() ?? Utility.getDefaultPrefix());
                    }
                    if(!option.getSelectedColor()) {
                        option.setSelectedColor(this.getConfigs()?.getSelected()?.getColor() ?? Utility.getDefaultColor());
                    }
                }
            }
            this.setValue(name, option);
        }

        return this;
    }

    public getConfigs(): MenuChoice['configs'] | undefined { return this.configs; }
    public setConfigs(data: MenuChoice['configs'] | Exclude<MenuChoiceJson['configs'], undefined>): this {
        if(data instanceof MenuChoiceConfigs) {
            this.configs = new MenuChoiceConfigs(
                data.getDefaults(),
                data.getSelected()
            );
        } else if(typeof data === 'object') {
            this.configs = new MenuChoiceConfigs(
                data.defaults,
                data.selected
            );
        }

        return this;
    }

    public isConfigDefaults(): boolean { return !!this.configs?.getDefaults(); }
    public isConfigSelected(): boolean { return !!this.configs?.getSelected(); }

    public isDefaultValues(
        value: Exclude<Exclude<Exclude<MenuChoice['configs'], undefined>['defaults'], undefined>['values'], undefined>[number]
    ): boolean { 
        return this.configs?.getDefaults()?.getValues().includes(value) ?? false; 
    }

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
    public isSelectedValue(value: string): boolean { return this.selectedValues.includes(value); }

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

        if(globalIndex >= 0) {
            values.splice(globalIndex, 0, new Separator());
        }

        this.setSelectedValues(await choices({
            message: this.getQuestionLabel(),
            choices: values.map(choice => {
                return (choice instanceof Separator) ? choice : {
                    ...choice.toJson(),
                    label: choice.getTranslationLabel(this.isSelectedValue(choice.getValue()))
                };
            }),
        }) as string[]);

        return this.getSelectedValues();
    }
}

export { 
    type MenuChoiceJson, 
    type MenuChoiceOptionJson,
    MenuChoice, 
    MenuChoiceOption, 
};