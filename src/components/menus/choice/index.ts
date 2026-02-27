import { choices, Choice, Separator } from "@/prompts/Choices";
import { appendFileSync } from "fs";
import { Menu, MenuJson } from "../menu";
import { Action } from "../../actions";
import { Utility } from "../../utility";
import { MenuChoiceOption, MenuChoiceOptionJson } from "./option";
import { MenuChoiceConfigs, MenuChoiceConfigsJson } from "./configs";
import chalk from "chalk";

// ── Shared list utilities ────────────────────────────────────────────────────

/**
 * Returns true if the item is an inquirer Separator.
 * Centralised here so both Choice and InputChoice prompts use the same check.
 */
const isSeparator = (item: any): boolean =>
    item != null &&
    typeof item === 'object' &&
    ('separator' in item || ('type' in item && item.type === 'separator'));

/**
 * Renders a scrollable choice list as an array of strings.
 * Used by both the standalone Choice prompt and the InputChoice prompt.
 */
const renderChoiceLines = (
    items: (Choice | Separator)[],
    activeIndex: number,
    focusedOnList: boolean,
): string[] => {
    return items.map((item, index) => {
        if(isSeparator(item)) return new Separator().separator;
        const choice = item as Choice;
        const isActive = focusedOnList && index === activeIndex;
        return `${isActive ? chalk.cyan('❯') : ' '} ${choice.label}`;
    });
};


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

            const aIsGlobal = aItem?.isGlobal() ?? false;
            const bIsGlobal = bItem?.isGlobal() ?? false;

            // Elementi globali sempre in fondo ai non-globali
            if(aIsGlobal && !bIsGlobal) return 1;
            if(!aIsGlobal && bIsGlobal) return -1;

            if(aIsGlobal && bIsGlobal) {
                const aIndex = aItem?.getIndex() ?? Infinity;
                const bIndex = bItem?.getIndex() ?? Infinity;

                // Index negativi = anchor di coda: più negativo = più in fondo.
                // Convenzione: back=-1 (terzultimo), language=-2 (penultimo), exit=-3 (ultimo).
                const aIsReserved = aIndex < 0;
                const bIsReserved = bIndex < 0;

                if(aIsReserved && !bIsReserved) return 1;
                if(!aIsReserved && bIsReserved) return -1;
                // Tra riservati: più negativo = più in fondo → sort invertito
                if(aIsReserved && bIsReserved) return bIndex - aIndex;

                // Tra non-riservati: indice, poi tipo (azioni prima), poi nome
                if(aIndex !== bIndex) return aIndex - bIndex;

                const aIsAction = aItem instanceof Action;
                const bIsAction = bItem instanceof Action;
                if(aIsAction && !bIsAction) return -1;
                if(!aIsAction && bIsAction) return 1;

                return aItem!.getName().localeCompare(bItem!.getName());
            }

            // Non-globali: indice, poi tipo (azioni prima), poi nome
            const aIndex = aItem ? (aItem.getIndex() ?? Infinity) : Infinity;
            const bIndex = bItem ? (bItem.getIndex() ?? Infinity) : Infinity;

            if(aIndex !== bIndex) return aIndex - bIndex;

            const aIsAction = aItem instanceof Action;
            const bIsAction = bItem instanceof Action;
            if(aIsAction && !bIsAction) return -1;
            if(!aIsAction && bIsAction) return 1;

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

        // Log rendered menu to menu.log
        try {
            const logPath = `${process.cwd()}/menu.log`;
            const header = `${new Date().toISOString()} ${this.getName()} - ${this.getQuestionLabel()}\n`;
            const lines = values.map(choice => {
                return (choice instanceof Separator) ? '──────────────' : choice.getTranslationLabel(false);
            }).join('\n');

            appendFileSync(logPath, header + lines + '\n\n');
        } catch (e) {
            // don't break execution on logging errors
        }

        const selected = await choices({
            message: Utility.write(this.getQuestionLabel(), this.getColor()),
            choices: values.map(choice => {
                return (choice instanceof Separator) ? choice : {
                    ...choice.toJson(),
                    label: choice.getTranslationLabel(this.isSelectedValue(choice.getValue()))
                };
            }),
        }) as string[];

        // Persist only non-action values (back, exit, …) so they don't show
        // the selected prefix next time the menu opens.
        // If the user picked only actions (e.g. back), keep the previous
        // selectedValues unchanged so the highlight stays correct.
        const nonActionSelected = selected.filter(val => {
            const option = this.getValue(val);
            return option ? !(option.getItem() instanceof Action) : true;
        });
        if(nonActionSelected.length > 0) {
            this.setSelectedValues(nonActionSelected);
        }

        // Return the full selection (including actions) so cli.ts can route it.
        return selected;
    }
}

export { 
    type MenuChoiceJson, 
    type MenuChoiceOptionJson,
    MenuChoice, 
    MenuChoiceOption,
    isSeparator,
    renderChoiceLines,
};