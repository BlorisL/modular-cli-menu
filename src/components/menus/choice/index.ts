import { Menu, MenuJson } from "@/components/menus/menu";
import { Action } from "@/components/actions";
import { Language, Translations } from "@/components/translations";
import { Utility } from "@/components/utility";
import { prompt, Choice, Separator } from "@/prompts/Prompt";
import { MenuFieldOption, MenuFieldOptionJson } from "@/components/menus/field/option";
import { MenuChoiceConfigs, MenuChoiceConfigsJson } from "@/components/menus/choice/config";

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

    /**
     * Creates a new choice menu with optional pre-configured options and callbacks.
     * @param data Menu JSON including name, type, optional values array/function, and choice-specific configs.
     */
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

    /**
     * Sorts option values for display: global items last, then by index, then by type (actions before menus), then alphabetically.
     */
    protected sortValues(): MenuFieldOption[] {
        return this.getValuesList().sort((a, b) => {
            const aItem = a.getItem();
            const bItem = b.getItem();
            const aGlobal = aItem?.isGlobal() ?? false;
            const bGlobal = bItem?.isGlobal() ?? false;

            if (aGlobal && !bGlobal) {
                return 1;
            } else if (!aGlobal && bGlobal) {
                return -1;
            } else if (aGlobal && bGlobal) {
                const aIdx = aItem?.getIndex() ?? Infinity;
                const bIdx = bItem?.getIndex() ?? Infinity;
                const aRes = aIdx < 0;
                const bRes = bIdx < 0;
                if (aRes && !bRes) {
                    return 1;
                } else if (!aRes && bRes) {
                    return -1;
                } else if (aRes && bRes) {
                    return bIdx - aIdx;
                } else if (aIdx !== bIdx) {
                    return aIdx - bIdx;
                } else {
                    const aAct = aItem instanceof Action;
                    const bAct = bItem instanceof Action;
                    if (aAct && !bAct) {
                        return -1;
                    } else if (!aAct && bAct) {
                        return 1;
                    } else {
                        return aItem!.getName().localeCompare(bItem!.getName());
                    }
                }
            } else {
                const aIdx = aItem ? (aItem.getIndex() ?? Infinity) : Infinity;
                const bIdx = bItem ? (bItem.getIndex() ?? Infinity) : Infinity;
                if (aIdx !== bIdx) {
                    return aIdx - bIdx;
                } else {
                    const aAct = aItem instanceof Action;
                    const bAct = bItem instanceof Action;
                    if (aAct && !bAct) {
                        return -1;
                    } else if (!aAct && bAct) {
                        return 1;
                    } else {
                        const aName = aItem ? aItem.getName() : a.getValue();
                        const bName = bItem ? bItem.getName() : b.getValue();
                        return aName.localeCompare(bName);
                    }
                }
            }
        });
    }

    /**
     * Applies cascading style resolution: option → menu → Utility defaults.
     * Global items do not inherit menu styles.
     */
    protected applyOptionStyles(option: MenuFieldOption): void {
        const os = option.getStyles();
        // Global items must never inherit any style from the host menu — only
        // their own styles and Utility defaults apply.
        const isGlobal = option.getItem()?.isGlobal() ?? false;
        const ms = isGlobal ? undefined : this.getStyles();

        const idlePrefix = os.getIdle()?.getPrefix() ?? ms?.getIdle()?.getPrefix() ?? Utility.getEnv().getIdlePrefix();
        const idleColor = os.getIdle()?.getColor() ?? ms?.getIdle()?.getColor() ?? Utility.getEnv().getIdleColor();
        const idleUnderline =
            os.getIdle()?.isUnderline() ?? ms?.getIdle()?.isUnderline() ?? Utility.getEnv().getIdleUnderline();
        const idleItalic = os.getIdle()?.isItalic() ?? ms?.getIdle()?.isItalic();

        option.setStyles({
            idle: { prefix: idlePrefix, color: idleColor, underline: idleUnderline, italic: idleItalic },
            hover: {
                prefix:
                    os.getHover()?.getPrefix()
                    ?? ms?.getHover()?.getPrefix()
                    ?? Utility.getEnv().getHoverPrefix()
                    ?? idlePrefix,
                color:
                    os.getHover()?.getColor()
                    ?? ms?.getHover()?.getColor()
                    ?? Utility.getEnv().getHoverColor()
                    ?? idleColor,
                underline:
                    os.getHover()?.isUnderline() ?? ms?.getHover()?.isUnderline() ?? Utility.getEnv().getHoverUnderline(),
                italic: os.getHover()?.isItalic() ?? ms?.getHover()?.isItalic(),
            },
            selected: {
                prefix:
                    os.getSelected()?.getPrefix()
                    ?? ms?.getSelected()?.getPrefix()
                    ?? Utility.getEnv().getSelectedPrefix()
                    ?? idlePrefix,
                color:
                    os.getSelected()?.getColor()
                    ?? ms?.getSelected()?.getColor()
                    ?? Utility.getEnv().getSelectedColor()
                    ?? idleColor,
                underline:
                    os.getSelected()?.isUnderline()
                    ?? ms?.getSelected()?.isUnderline()
                    ?? Utility.getEnv().getSelectedUnderline(),
                italic: os.getSelected()?.isItalic() ?? ms?.getSelected()?.isItalic(),
            },
        });
    }

    // values API

    /** Resolves runtime values to a concrete map. */
    protected resolveValuesMap(): MenuChoiceValuesMap {
        const result = typeof this.values === "function"
            ? (this.values as MenuChoiceValuesResolvedFn)({ menu: this })
            : this.values
        ;
        return result;
    }

    /**
     * Returns the current option values.
     * @param map When true, returns a `MenuChoiceValuesMap` keyed by option name.
     * When false (default), returns a flat `MenuFieldOption[]`.
     */
    public getValues(map: true): MenuChoiceValuesMap;
    public getValues(map?: false): MenuFieldOption[];
    public getValues(map: boolean = false): MenuFieldOption[] | MenuChoiceValuesMap {
        const values: MenuChoiceValuesMap = this.resolveValuesMap();
        return map ? values : Object.values(values);
    }

    /** Returns all option values as a map keyed by option name. */
    public getValuesMap(): MenuChoiceValuesMap {
        return this.getValues(true) as MenuChoiceValuesMap;
    }

    /** Returns all option values as a flat array. */
    public getValuesList(): MenuFieldOption[] {
        return this.getValues(false) as MenuFieldOption[];
    }

    /**
     * Returns the option list, optionally sorted for display.
     * @param sorted When true, applies the display-order sorting algorithm.
     */
    public getOptions(sorted = false): MenuFieldOption[] {
        return sorted ? this.sortValues() : this.getValuesList();
    }

    /**
     * Returns the option matching the given name, or undefined.
     * @param name Option value/name to look up.
     */
    public getOption(name: string): MenuFieldOption | undefined {
        return this.getValuesMap()[name];
    }

    /**
     * Replaces or inserts a named option.
     * @param name Option key.
     * @param value Replacement MenuFieldOption.
     */
    public setOption(name: string, value: MenuFieldOption): this {
        if (typeof this.values === "function") {
            this.values = { ...this.resolveValuesMap() };
        }
        this.values[name] = value;
        return this;
    }

    /**
     * Adds an option from a Menu, Action, MenuFieldOption, or raw JSON value.
     * Styles are resolved and applied automatically.
     * @param value The option to add.
     */
    public addOption(value: Menu | Action | MenuFieldOption | MenuChoiceJsonValue): this;
    public addOption(value: Menu): this;
    public addOption(value: Action): this;
    public addOption(value: Menu | Action): this;
    public addOption(value: MenuFieldOption): this;
    public addOption(value: MenuChoiceJsonValue): this;
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
            option = new MenuFieldOption(value.value, value.multi, value.labels, value.styles);
        }

        if (name && option) {
            this.applyOptionStyles(option);
            this.setOption(name, option);
        }
        return this;
    }

    /** Returns true when at least one option is registered. */
    public hasChoices(): boolean {
        const resolved = this.resolveValuesMap();
        return Object.keys(resolved).length > 0;
    }

    // selected values API

    /** Returns the currently selected values. */
    public getSelectedValues(): string[] {
        return this.selectedValues;
    }

    /**
     * Replaces the selected values list.
     * @param v New array of selected option names.
     */
    public setSelectedValues(v: string[]): this {
        this.selectedValues = v;
        return this;
    }

    /**
     * Adds a value to the selected values list if not already present.
     * @param v Option name to select.
     */
    public addSelectedValue(v: string): this {
        if (!this.selectedValues.includes(v)) {
            this.selectedValues.push(v);
        }
        return this;
    }

    /**
     * Removes a value from the selected values list.
     * @param v Option name to deselect.
     */
    public delSelectedValue(v: string): this {
        this.selectedValues = this.selectedValues.filter((s) => s !== v);
        return this;
    }

    /**
     * Returns true when the given value is in the selected list.
     * @param v Option name to check.
     */
    public isSelectedValue(v: string): boolean {
        return this.selectedValues.includes(v);
    }

    // configs API

    /** Returns the configs object for this choice menu. */
    public getConfigs(): MenuChoiceConfigs {
        return this.configs;
    }

    /**
     * Sets the configs from an instance or a plain JSON object.
     * @param data MenuChoiceConfigs instance or compatible JSON.
     */
    public setConfigs(data: MenuChoiceConfigs | MenuChoiceConfigsJson): this {
        this.configs = data instanceof MenuChoiceConfigs ? data : new MenuChoiceConfigs(data);
        return this;
    }

    // toJson

    /** Serialises this choice menu to a plain JSON-compatible object. */
    public toJson(): MenuChoiceJson {
        return {
            ...super.toJson(),
            type: "choice" as const,
            ...(this.getValuesList().length > 0 ? { values: this.getValuesList().map((v) => v.toJson()) } : {}),
            ...(Object.keys(this.configs.toJson()).length > 0 ? { configs: this.configs.toJson() } : {}),
        };
    }

    // run

    /**
     * Renders and runs the interactive choice prompt.
     * @param language Optional language override for label translation.
     */
    public async run(language?: Language): Promise<string | string[]> {
        console.clear();

        const isSelectable = this.configs.isSelectable();
        const selectedValues = this.selectedValues;

        const values = this.getOptions(true);
        const globalIndex = values.findIndex((v) => v.getItem()?.isGlobal());
        const items: (MenuFieldOption | Separator)[] = [...values];
        if (globalIndex >= 0) {
            items.splice(globalIndex, 0, new Separator());
        }

        const choiceList: (Choice | Separator)[] = items.map((item) => {
            let choiceItem: Choice | Separator;
            if (item instanceof Separator) {
                choiceItem = item;
            } else {
                const isSelected =
                    isSelectable && !item.getItem()?.isGlobal() && this.selectedValues.includes(item.getValue());

                choiceItem = {
                    value: item.getValue(),
                    label:
                        item.getItem()?.getLabels().getTitle()?.getValue(language)
                        ?? item.getLabels().getTitle()?.getValue(language)
                        ?? Translations.getTranslation(item.getValue(), language),
                    multi: item.isMulti(),
                    ...(item.getStyles().getIdle()
                        ? {
                                idle: {
                                    prefix: item.getStyles().getIdle()?.getPrefix(),
                                    color: item.getStyles().getIdle()?.getColor(),
                                    underline: item.getStyles().getIdle()?.isUnderline(),
                                    italic: item.getStyles().getIdle()?.isItalic(),
                                },
                            }
                        : {}),
                    ...(item.getStyles().getHover()
                        ? {
                                hover: {
                                    prefix: item.getStyles().getHover()?.getPrefix(),
                                    color: item.getStyles().getHover()?.getColor(),
                                    underline: item.getStyles().getHover()?.isUnderline(),
                                    italic: item.getStyles().getHover()?.isItalic(),
                                },
                            }
                        : {}),
                    ...(item.getStyles().getSelected()
                        ? {
                                selected: {
                                    prefix: item.getStyles().getSelected()?.getPrefix(),
                                    color: item.getStyles().getSelected()?.getColor(),
                                    underline: item.getStyles().getSelected()?.isUnderline(),
                                    italic: item.getStyles().getSelected()?.isItalic(),
                                    active: isSelected,
                                },
                            }
                        : {}),
                };
            }
            return choiceItem;
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
            pageSize: this.configs.getPageSize() ?? Utility.getEnv().getPageSize(),
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

export { type MenuChoiceJson, type MenuChoiceJsonValue, type MenuChoiceConfigsJson, MenuChoice, MenuChoiceConfigs };
