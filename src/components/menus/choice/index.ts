import { Menu, MenuJson } from "@/components/menus/menu";
import { Action } from "@/components/actions";
import { Language, Translations } from "@/components/translations";
import { Utility } from "@/components/utility";
import { prompt, Choice, Separator } from "@/prompts/Prompt";
import { MenuFieldOption, MenuFieldOptionJson } from "@/components/menus/field/option";
import { MenuChoiceConfigs, MenuChoiceConfigsJson } from "./config";

type MenuChoiceJsonValue = string | MenuFieldOptionJson;

type MenuChoiceJson = Omit<MenuJson, "type"> & {
    type: "choice";
    values?: Array<MenuChoiceJsonValue> | ((data: { menu: MenuChoice }) => Array<MenuChoiceJsonValue>);
    configs?: MenuChoiceConfigsJson;
};

type MenuChoiceValuesMap = Record<string, MenuFieldOption>;
type MenuChoiceValuesFn = (data: { menu: MenuChoice }) => Array<MenuChoiceJsonValue>;
type MenuChoiceValuesResolvedFn = (data: { menu: MenuChoice }) => MenuChoiceValuesMap;

class MenuChoice extends Menu {
    protected type: MenuJson["type"] = "choice";
    protected values: MenuChoiceValuesMap | MenuChoiceValuesResolvedFn = {};
    protected selectedValues: string[] = [];
    protected configs: MenuChoiceConfigs = new MenuChoiceConfigs();

    constructor(data: MenuChoiceJson) {
        super(data);
        this.configs = data.configs ? new MenuChoiceConfigs(data.configs) : new MenuChoiceConfigs();
        this.selectedValues = [...(data.configs?.defaultValues ?? [])];

        if (data.values) {
            if (Array.isArray(data.values)) {
                data.values.forEach((v) => this.addOption(v));
            } else {
                const sourceFn = data.values as MenuChoiceValuesFn;
                this.values = ({ menu }: { menu: MenuChoice }): MenuChoiceValuesMap => {
                    const result: MenuChoiceValuesMap = {};
                    sourceFn({ menu }).forEach((v: MenuChoiceJsonValue) => {
                        let name: string | undefined;
                        let option: MenuFieldOption | undefined;
                        if (typeof v === "string") {
                            name = v;
                            option = new MenuFieldOption(v);
                        } else if (typeof v === "object") {
                            name = v.value;
                            option = new MenuFieldOption(v.value, v.multi, v.labels, v.styles);
                        }
                        if (name && option) {
                            menu.applyOptionStyles(option);
                            result[name] = option;
                        }
                    });
                    return result;
                };
            }
        }
    }

    // internals

    protected sortValues(): MenuFieldOption[] {
        return this.getValuesList().sort((a, b) => {
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
                if (aRes && bRes) return bIdx - aIdx;
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

    protected applyOptionStyles(option: MenuFieldOption): void {
        const os = option.getStyles();
        // Global items must never inherit any style from the host menu — only
        // their own styles and Utility defaults apply.
        const isGlobal = option.getItem()?.isGlobal() ?? false;
        const ms = isGlobal ? undefined : this.getStyles();

        const idlePrefix    = os.getIdle()?.getPrefix()    ?? ms?.getIdle()?.getPrefix()    ?? Utility.getDefaultIdlePrefix();
        const idleColor     = os.getIdle()?.getColor()     ?? ms?.getIdle()?.getColor()     ?? Utility.getDefaultIdleColor();
        const idleUnderline = os.getIdle()?.isUnderline()  ?? ms?.getIdle()?.isUnderline()  ?? Utility.getDefaultIdleUnderline();
        const idleItalic    = os.getIdle()?.isItalic()     ?? ms?.getIdle()?.isItalic();

        option.setStyles({
            idle: { prefix: idlePrefix, color: idleColor, underline: idleUnderline, italic: idleItalic },
            hover: {
                prefix:    os.getHover()?.getPrefix()    ?? ms?.getHover()?.getPrefix()    ?? Utility.getDefaultHoverPrefix()    ?? idlePrefix,
                color:     os.getHover()?.getColor()     ?? ms?.getHover()?.getColor()     ?? Utility.getDefaultHoverColor()     ?? idleColor,
                underline: os.getHover()?.isUnderline()  ?? ms?.getHover()?.isUnderline()  ?? Utility.getDefaultHoverUnderline(),
                italic:    os.getHover()?.isItalic()     ?? ms?.getHover()?.isItalic(),
            },
            selected: {
                prefix:    os.getSelected()?.getPrefix()    ?? ms?.getSelected()?.getPrefix()    ?? Utility.getDefaultSelectedPrefix()    ?? idlePrefix,
                color:     os.getSelected()?.getColor()     ?? ms?.getSelected()?.getColor()     ?? Utility.getDefaultSelectedColor()     ?? idleColor,
                underline: os.getSelected()?.isUnderline()  ?? ms?.getSelected()?.isUnderline()  ?? Utility.getDefaultSelectedUnderline(),
                italic:    os.getSelected()?.isItalic()     ?? ms?.getSelected()?.isItalic(),
            },
        });
    }

    // values API

    public getValues(map: boolean = false): MenuFieldOption[] | MenuChoiceValuesMap {
        const values = typeof this.values === "function"
            ? (this.values as MenuChoiceValuesResolvedFn)({ menu: this })
            : this.values;
        return map ? values : Object.values(values);
    }
    public getValuesMap(): MenuChoiceValuesMap     { return this.getValues(true)  as MenuChoiceValuesMap; }
    public getValuesList(): MenuFieldOption[]       { return this.getValues(false) as MenuFieldOption[]; }
    public getOptions(sorted = false): MenuFieldOption[] {
        return sorted ? this.sortValues() : this.getValuesList();
    }
    public getOption(name: string): MenuFieldOption | undefined {
        return this.getValuesMap()[name];
    }
    public setOption(name: string, value: MenuFieldOption): this {
        if (typeof this.values === "function") {
            const vals = (this.values as MenuChoiceValuesResolvedFn)({ menu: this });
            vals[name] = value;
            this.values = vals;
        } else {
            this.values[name] = value;
        }
        return this;
    }
    public addOption(value: Menu | Action | MenuFieldOption | MenuChoiceJsonValue): this {
        let name: string | undefined;
        let option: MenuFieldOption | undefined;

        if (value instanceof Menu || value instanceof Action) {
            name = value.getName();
            option = new MenuFieldOption(value).setStyles(value.getStyles().toJson());
        } else if (value instanceof MenuFieldOption) {
            name = value.getValue();
            option = value;
        } else if (typeof value === "string") {
            name = value;
            option = new MenuFieldOption(value);
        } else if (typeof value === "object") {
            name = value.value;
            option = new MenuFieldOption(
                value.value,
                value.multi,
                value.labels,
                value.styles
            );
        }

        if (name && option) {
            this.applyOptionStyles(option);
            this.setOption(name, option);
        }
        return this;
    }
    public hasChoices(): boolean {
        const resolved = typeof this.values === "function"
            ? (this.values as MenuChoiceValuesResolvedFn)({ menu: this })
            : this.values;
        return Object.keys(resolved).length > 0;
    }

    // selected values API

    public getSelectedValues(): string[] { return this.selectedValues; }
    public setSelectedValues(v: string[]): this { this.selectedValues = v; return this; }
    public addSelectedValue(v: string): this {
        if (!this.selectedValues.includes(v)) this.selectedValues.push(v);
        return this;
    }
    public delSelectedValue(v: string): this {
        this.selectedValues = this.selectedValues.filter((s) => s !== v);
        return this;
    }
    public isSelectedValue(v: string): boolean { return this.selectedValues.includes(v); }

    // configs API

    public getConfigs(): MenuChoiceConfigs { return this.configs; }
    public setConfigs(data: MenuChoiceConfigs | MenuChoiceConfigsJson): this {
        this.configs = data instanceof MenuChoiceConfigs ? data : new MenuChoiceConfigs(data);
        return this;
    }

    // toJson

    public toJson(): MenuChoiceJson {
        return {
            ...super.toJson(),
            type: "choice" as const,
            ...(this.getValuesList().length > 0 ? { values: this.getValuesList().map((v) => v.toJson()) } : {}),
            ...(Object.keys(this.configs.toJson()).length > 0 ? { configs: this.configs.toJson() } : {}),
        };
    }

    // run

    public async run(language?: Language): Promise<string | string[]> {
        console.clear();

        const isSelectable = this.configs.isSelectable();
        const selectedValues = this.selectedValues;

        const values = this.getOptions();
        const globalIndex = values.findIndex((v) => v.getItem()?.isGlobal());
        const items: (MenuFieldOption | Separator)[] = [...values];
        if (globalIndex >= 0) {
            items.splice(globalIndex, 0, new Separator());
        }

        const choiceList: (Choice | Separator)[] = items.map((item) => {
            if (item instanceof Separator) return item;

            const isSelected = isSelectable && !item.getItem()?.isGlobal() && this.selectedValues.includes(item.getValue());

            return {
                value: item.getValue(),
                label:
                    item.getItem()?.getLabels().getTitle()?.getValue(language) ??
                    item.getLabels().getTitle()?.getValue(language) ??
                    Translations.getTranslation(item.getValue(), language),
                multi: item.isMulti(),
                ...(item.getStyles().getIdle() ? {
                    idle: {
                        prefix:    item.getStyles().getIdle()?.getPrefix(),
                        color:     item.getStyles().getIdle()?.getColor(),
                        underline: item.getStyles().getIdle()?.isUnderline(),
                        italic:    item.getStyles().getIdle()?.isItalic(),
                    },
                } : {}),
                ...(item.getStyles().getHover() ? {
                    hover: {
                        prefix:    item.getStyles().getHover()?.getPrefix(),
                        color:     item.getStyles().getHover()?.getColor(),
                        underline: item.getStyles().getHover()?.isUnderline(),
                        italic:    item.getStyles().getHover()?.isItalic(),
                    },
                } : {}),
                ...(item.getStyles().getSelected() ? {
                    selected: {
                        prefix:    item.getStyles().getSelected()?.getPrefix(),
                        color:     item.getStyles().getSelected()?.getColor(),
                        underline: item.getStyles().getSelected()?.isUnderline(),
                        italic:    item.getStyles().getSelected()?.isItalic(),
                        active:    isSelected,
                    },
                } : {}),
            };
        });

        Utility.log(
            [
                new Date().toISOString(),
                `${this.getName()} - ${this.getLabels().getQuestion()?.getValue(language)}`,
                ...choiceList.map((c) => (c instanceof Separator ? c.separator : (c as Choice).label)),
            ].join("\n") + "\n"
        );

        const result = await prompt({
            message: this.getLabels().getQuestion()!.write({ color: this.getStyles().getIdle()?.getColor(), language }),
            choices: choiceList,
            ...(isSelectable && selectedValues.length > 0 ? { initialSelected: selectedValues } : {}),
        });

        if (result.type === "choice") {
            const picked = this.getOption(result.value);
            if (picked && !(picked.getItem() instanceof Action)) {
                this.selectedValues = [result.value];
            }
            return [result.value];
        }

        if (result.type === "choices") {
            const nonActionSelected = result.values.filter((val: string) => {
                const option = this.getOption(val);
                return option ? !(option.getItem() instanceof Action) : true;
            });
            if (nonActionSelected.length > 0) {
                this.selectedValues = nonActionSelected;
            }
            return result.values;
        }

        return [];
    }
}

export {
    type MenuChoiceJson,
    type MenuChoiceJsonValue,
    type MenuChoiceConfigsJson,
    MenuChoice,
    MenuChoiceConfigs,
};
