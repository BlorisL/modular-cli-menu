import { Menu, MenuJson } from '../menu';
import { Action } from '../../actions';
import { Language, Translations } from '../../translations';
import { Utility } from '../../utility';
import { prompt, Choice, Separator, isSeparator, renderChoiceLines } from '@/prompts/Prompt';
import { MenuFieldConfigs, MenuFieldConfigsJson } from './configs';
import { MenuFieldOption, MenuFieldOptionJson } from './option';

// Mode JSON types

type MenuFieldJsonValue = string | MenuFieldOptionJson;

type MenuFieldChoicesModeJson = {
    values?: Array<MenuFieldJsonValue> | ((data: { menu: MenuField }) => Array<MenuFieldJsonValue>);
    configs?: MenuFieldConfigsJson;
};

type MenuFieldInputModeJson = {
    value?: string;
    placeholder?: string;
    clear?: boolean;
    fastSubmit?: boolean;
    inline?: boolean;
    validate?: (value: string) => boolean | string;
    callback?: MenuFieldInputCallback;
};

// Main JSON type

type MenuFieldJson = MenuJson & {
    modes?: {
        choices?: MenuFieldChoicesModeJson;
        input?: MenuFieldInputModeJson;
    };
};

// Callback type

type MenuFieldInputCallback = (data: {
    menu: MenuField;
    value: string;
    language?: Language;
    parent?: string;
}) => Promise<void>;

// Values map

type MenuFieldValues = Record<string, MenuFieldOption>;

// MenuField

class MenuField extends Menu {
    protected type: MenuFieldJson['type'] = 'field';

    // choices mode
    protected values: MenuFieldValues | ((data: { menu: MenuField }) => MenuFieldValues) = {};
    protected selectedValues: string[] = [];
    protected configs?: MenuFieldConfigs;

    // input mode
    protected inputValue: string  = '';
    protected placeholder: string = '';
    protected clear: boolean      = true;
    protected fastSubmit: boolean = false;
    protected inline: boolean     = false;
    protected validate?: (value: string) => boolean | string;
    protected inputCallback?: MenuFieldInputCallback;

    // runtime
    protected globalChoices: (Choice | Separator)[] = [];
    protected lastParent: string | undefined;

    constructor(data: MenuFieldJson) {
        super(data);

        const choicesMode = data.modes?.choices;
        const inputMode   = data.modes?.input;

        // ── choices mode setup
        this.setConfigs(choicesMode?.configs);
        this.setSelectedValues(this.getConfigs()?.getDefaults()?.getValues() ?? []);

        if (choicesMode?.values) {
            if (Array.isArray(choicesMode.values)) {
                choicesMode.values.forEach(v => this.addValue(v));
            } else {
                const sourceFn = choicesMode.values as (data: { menu: MenuField }) => Array<MenuFieldJsonValue>;
                this.values = ({ menu }: { menu: MenuField }) => {
                    const result: MenuFieldValues = {};
                    sourceFn({ menu }).forEach((v: MenuFieldJsonValue) => {
                        let name: string | undefined;
                        let option: MenuFieldOption | undefined;
                        if (typeof v === 'string') {
                            name   = v;
                            option = new MenuFieldOption(v);
                        } else if (typeof v === 'object') {
                            name   = v.value;
                            option = new MenuFieldOption(v.value, v.label, v.multi, v.color, v.selected);
                        }
                        if (name && option) {
                            if (menu.isConfigSelected()) {
                                if (!option.getSelected()) {
                                    option.setSelectedPrefix(menu.getConfigs()?.getSelected()?.getPrefix() ?? Utility.getDefaultPrefix());
                                    option.setSelectedColor(menu.getConfigs()?.getSelected()?.getColor()   ?? Utility.getDefaultColor());
                                } else {
                                    if (!option.getSelectedPrefix()) option.setSelectedPrefix(menu.getConfigs()?.getSelected()?.getPrefix() ?? Utility.getDefaultPrefix());
                                    if (!option.getSelectedColor())  option.setSelectedColor(menu.getConfigs()?.getSelected()?.getColor()   ?? Utility.getDefaultColor());
                                }
                            }
                            result[name] = option;
                        }
                    });
                    return result;
                };
            }
        }

        // ── input mode setup
        if (inputMode) {
            this.inputValue    = inputMode.value       ?? '';
            this.placeholder   = inputMode.placeholder ?? '';
            this.clear         = inputMode.clear       ?? true;
            this.fastSubmit    = inputMode.fastSubmit  ?? false;
            this.inline        = inputMode.inline      ?? false;
            this.validate      = inputMode.validate;
            this.inputCallback = inputMode.callback;
        }
    }

    // ── mode helpers

    public hasChoices(): boolean {
        const resolved = typeof this.values === 'function' ? this.values({ menu: this }) : this.values;
        return Object.keys(resolved).length > 0;
    }

    public hasInput(): boolean {
        return this.inputCallback !== undefined || this.validate !== undefined || this.fastSubmit;
    }

    // ── choices API

    protected resolveValues(): MenuFieldValues {
        return typeof this.values === 'function' ? this.values({ menu: this }) : this.values;
    }

    public getValues(): MenuFieldOption[] { return this.sortValues(); }

    protected sortValues(): MenuFieldOption[] {
        return Object.values(this.resolveValues()).sort((a, b) => {
            const aItem = a.getItem();
            const bItem = b.getItem();
            const aGlobal = aItem?.isGlobal() ?? false;
            const bGlobal = bItem?.isGlobal() ?? false;

            if (aGlobal && !bGlobal) return 1;
            if (!aGlobal && bGlobal) return -1;

            if (aGlobal && bGlobal) {
                const aIdx = aItem?.getIndex() ?? Infinity;
                const bIdx = bItem?.getIndex() ?? Infinity;
                const aRes = aIdx < 0;
                const bRes = bIdx < 0;
                if (aRes && !bRes) return 1;
                if (!aRes && bRes) return -1;
                if (aRes && bRes)  return bIdx - aIdx;
                if (aIdx !== bIdx) return aIdx - bIdx;
                const aAct = aItem instanceof Action;
                const bAct = bItem instanceof Action;
                if (aAct && !bAct) return -1;
                if (!aAct && bAct) return 1;
                return aItem!.getName().localeCompare(bItem!.getName());
            }

            const aIdx = aItem ? (aItem.getIndex() ?? Infinity) : Infinity;
            const bIdx = bItem ? (bItem.getIndex() ?? Infinity) : Infinity;
            if (aIdx !== bIdx) return aIdx - bIdx;
            const aAct = aItem instanceof Action;
            const bAct = bItem instanceof Action;
            if (aAct && !bAct) return -1;
            if (!aAct && bAct) return 1;
            const aName = aItem ? aItem.getName() : a.getValue();
            const bName = bItem ? bItem.getName() : b.getValue();
            return aName.localeCompare(bName);
        });
    }

    public getValue(name: string): MenuFieldOption | undefined {
        return this.resolveValues()[name];
    }

    public setValue(name: string, value: MenuFieldOption): this {
        if (typeof this.values === 'function') {
            const vals  = this.values({ menu: this });
            vals[name]  = value;
            this.values = vals;
        } else {
            this.values[name] = value;
        }
        return this;
    }

    public addValue(value: Menu | Action | MenuFieldOption | MenuFieldJsonValue): this {
        let name: string | undefined;
        let option: MenuFieldOption | undefined;

        if (value instanceof Menu || value instanceof Action) {
            name   = value.getName();
            option = new MenuFieldOption(value, value.getName(), false, value.getColor());
        } else if (value instanceof MenuFieldOption) {
            name   = value.getValue();
            option = value;
        } else if (typeof value === 'string') {
            name   = value;
            option = new MenuFieldOption(value);
        } else if (typeof value === 'object') {
            name   = value.value;
            option = new MenuFieldOption(value.value, value.label, value.multi, value.color, value.selected);
        }

        if (name && option) {
            if (this.isConfigSelected()) {
                if (!option.getSelected()) {
                    option.setSelectedPrefix(this.getConfigs()?.getSelected()?.getPrefix() ?? Utility.getDefaultPrefix());
                    option.setSelectedColor(this.getConfigs()?.getSelected()?.getColor()   ?? Utility.getDefaultColor());
                } else {
                    if (!option.getSelectedPrefix()) option.setSelectedPrefix(this.getConfigs()?.getSelected()?.getPrefix() ?? Utility.getDefaultPrefix());
                    if (!option.getSelectedColor())  option.setSelectedColor(this.getConfigs()?.getSelected()?.getColor()  ?? Utility.getDefaultColor());
                }
            }
            this.setValue(name, option);
        }

        return this;
    }

    public getConfigs(): MenuFieldConfigs | undefined { return this.configs; }
    public setConfigs(data?: MenuFieldConfigs | MenuFieldConfigsJson): this {
        if (data instanceof MenuFieldConfigs) {
            this.configs = new MenuFieldConfigs(data.getDefaults(), data.getSelected());
        } else if (typeof data === 'object') {
            this.configs = new MenuFieldConfigs(data.defaults, data.selected);
        }
        return this;
    }

    public isConfigDefaults(): boolean { return !!this.configs?.getDefaults(); }
    public isConfigSelected(): boolean { return !!this.configs?.getSelected(); }

    public isDefaultValues(value: string): boolean {
        return this.configs?.getDefaults()?.getValues().includes(value) ?? false;
    }

    public setSelectedValues(values: string[]): this { this.selectedValues = values; return this; }
    public getSelectedValues(): string[]             { return this.selectedValues; }
    public addSelectedValue(value: string): this {
        if (!this.selectedValues.includes(value)) this.selectedValues.push(value);
        return this;
    }
    public delSelectedValue(value: string): this {
        this.selectedValues = this.selectedValues.filter(v => v !== value);
        return this;
    }
    public isSelectedValue(value: string): boolean { return this.selectedValues.includes(value); }

    // ── input API

    public getInputValue(): string        { return this.inputValue; }
    public setInputValue(v: string): this { this.inputValue = v; return this; }

    public getPlaceholder(): string        { return this.placeholder; }
    public setPlaceholder(v: string): this { this.placeholder = v; return this; }

    public isClear(): boolean         { return this.clear; }
    public setClear(v: boolean): this { this.clear = v; return this; }

    public isFastSubmit(): boolean        { return this.fastSubmit; }
    public setFastSubmit(v: boolean): this { this.fastSubmit = v; return this; }

    public isInline(): boolean        { return this.inline; }
    public setInline(v: boolean): this { this.inline = v; return this; }

    public getValidate(): MenuField['validate']                  { return this.validate; }
    public setValidate(v: MenuField['validate']): this           { this.validate = v; return this; }

    public getCallback(): MenuFieldInputCallback | undefined     { return this.inputCallback; }
    public setCallback(v: MenuFieldInputCallback | undefined): this { this.inputCallback = v; return this; }

    public getGlobalChoices(): (Choice | Separator)[]                { return this.globalChoices; }
    public setGlobalChoices(choices: (Choice | Separator)[]): this   { this.globalChoices = choices; return this; }

    public getLastParent(): string | undefined  { return this.lastParent; }
    public setLastParent(parent: string): this  { this.lastParent = parent; return this; }

    public getPlaceholderName(): string {
        return `${this.getPlugin() ?? 'default'}.${this.getName()}.placeholder`;
    }

    public getPlaceholderLabel(language?: Language): string {
        if (this.placeholder.length > 0) {
            return Translations.getTranslation(this.placeholder, language) ?? this.placeholder;
        }
        const key = this.getPlaceholderName();
        const translated = Translations.getTranslation(key, language);
        return translated !== key ? translated : key;
    }

    // ── toJson

    public toJson(): MenuFieldJson {
        const choicesValues = Object.values(this.resolveValues()).map(v => v.toJson());
        const hasChoiceMode = choicesValues.length > 0 || !!this.configs;
        const hasInputMode  = !!(this.inputCallback || this.validate || this.fastSubmit);

        return {
            ...super.toJson(),
            type: this.type,
            modes: {
                ...(hasChoiceMode ? {
                    choices: {
                        values: choicesValues,
                    },
                } : {}),
                ...(hasInputMode ? {
                    input: {
                        value:       this.inputValue,
                        placeholder: this.placeholder,
                        clear:       this.clear,
                        fastSubmit:  this.fastSubmit,
                        inline:      this.inline,
                    },
                } : {}),
            },
        };
    }

    // ── run

    public async run(language?: Language): Promise<string | string[]> {
        const hasChoicesSection = this.hasChoices() || this.globalChoices.length > 0;
        const hasInputSection   = !!(this.inputCallback || this.validate || this.fastSubmit || this.placeholder);

        if (hasInputSection && this.isClear()) console.clear();
        else if (!hasInputSection)             console.clear();

        // Build choices list
        const buildChoices = (): (Choice | Separator)[] => {
            if (!hasChoicesSection) return [];

            const values      = this.getValues();
            const globalIndex = values.findIndex(v => v.getItem()?.isGlobal());
            const items: (MenuFieldOption | Separator)[] = [...values];
            if (globalIndex >= 0) items.splice(globalIndex, 0, new Separator());

            const choiceList: (Choice | Separator)[] = items.map(item => {
                if (item instanceof Separator) return item;
                return {
                    value: item.getValue(),
                    label: item.getTranslationLabel(this.isSelectedValue(item.getValue()), language),
                    multi: item.isMulti(),
                };
            });

            if (this.globalChoices.length > 0) choiceList.push(...this.globalChoices);
            return choiceList;
        };

        const choiceList = buildChoices();
        if (hasChoicesSection) {
            Utility.log([
                new Date().toISOString(), 
                `${this.getName()} - ${this.getQuestionLabel(language)}`,
                ...choiceList.map(c => c instanceof Separator 
                    ? c.separator
                    : (c as Choice).label
                )
            ].join('\n') + '\n');
        }

        // Wrap validate to resolve translated error message
        const translatedValidate = this.validate
            ? (value: string): boolean | string => {
                const res = this.validate!(value);
                if (res === true || res === undefined) return true;
                if (typeof res === 'string' && res.length > 0) {
                    const asKey = Translations.getTranslation(res, language);
                    if (asKey !== res) return asKey;
                }
                return this.getErrorLabel(language);
            }
            : undefined;

        const result = await prompt({
            message: Utility.write(this.getQuestionLabel(language), this.getColor()),
            ...(hasInputSection ? {
                input: {
                    value:       this.inputValue,
                    placeholder: this.getPlaceholderLabel(language),
                    fastSubmit:  this.fastSubmit,
                    inline:      this.inline,
                    validate:    translatedValidate,
                },
            } : {}),
            ...(hasChoicesSection ? { choices: choiceList } : {}),
        });

        // ── Handle result

        if (result.type === 'input') {
            this.inputValue = result.value;
            
            Utility.log([
                new Date().toISOString(), 
                `${this.getName()} - ${this.getQuestionLabel(language)}`,
                result.value
            ].join('\n') + '\n');

            return result.value;
        }

        if (result.type === 'choice') {
            const picked = this.getValue(result.value);
            if (picked && !(picked.getItem() instanceof Action)) {
                this.setSelectedValues([result.value]);
            }
            return [result.value];
        }

        // result.type === 'choices' (multi)
        const nonActionSelected = result.values.filter(val => {
            const option = this.getValue(val);
            return option ? !(option.getItem() instanceof Action) : true;
        });
        if (nonActionSelected.length > 0) this.setSelectedValues(nonActionSelected);
        return result.values;
    }
}

export {
    type MenuFieldJson,
    type MenuFieldOptionJson,
    type MenuFieldJsonValue,
    type MenuFieldChoicesModeJson,
    type MenuFieldInputModeJson,
    type MenuFieldInputCallback,
    MenuField,
    MenuFieldOption,
    isSeparator,
    renderChoiceLines,
};