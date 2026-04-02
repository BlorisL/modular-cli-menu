import { Menu, MenuJson, MenuLabelsJson } from "../menu";
import { Action } from "../../actions";
import { Language, Translations } from "../../translations";
import { Utility } from "../../utility";
import { prompt, Choice, Separator } from "@/prompts/Prompt";
import { MenuFieldOption, MenuFieldOptionJson } from "./option";
import { MenuFieldConfigs, MenuFieldConfigsJson } from "./configs";
import { MenuInputLabels } from "../input/labels";

// JSON types

type MenuFieldJsonValue = string | MenuFieldOptionJson;

type MenuFieldJson = Omit<MenuJson, "type" | "labels"> & {
    type: "field";
    labels?: MenuLabelsJson;
    values?: Array<MenuFieldJsonValue> | ((data: { menu: MenuField }) => Array<MenuFieldJsonValue>);
    configs?: MenuFieldConfigsJson;
};

// Internal types

type MenuFieldValuesMap = Record<string, MenuFieldOption>;
type MenuFieldValuesFn = (data: { menu: MenuField }) => Array<MenuFieldJsonValue>;
type MenuFieldValuesResolvedFn = (data: { menu: MenuField }) => MenuFieldValuesMap;

// MenuField

class MenuField extends Menu {
    protected type: MenuJson["type"] = "field";
    protected values: MenuFieldValuesMap | MenuFieldValuesResolvedFn = {};
    protected configs: MenuFieldConfigs = new MenuFieldConfigs();
    protected globalChoices: (Choice | Separator)[] = [];

    constructor(data: MenuFieldJson) {
        super(data);

        if (data.configs) {
            this.configs = new MenuFieldConfigs(data.configs);
        }

        if (data.values) {
            if (Array.isArray(data.values)) {
                data.values.forEach((v) => this.addOption(v));
            } else {
                const sourceFn = data.values as MenuFieldValuesFn;
                this.values = ({ menu }: { menu: MenuField }): MenuFieldValuesMap => {
                    const result: MenuFieldValuesMap = {};
                    sourceFn({ menu }).forEach((v: MenuFieldJsonValue) => {
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

            if (aGlobal && !bGlobal) {
                return 1;
            }
            if (!aGlobal && bGlobal) {
                return -1;
            }

            if (aGlobal && bGlobal) {
                const aIdx = aItem?.getIndex() ?? Infinity;
                const bIdx = bItem?.getIndex() ?? Infinity;
                const aRes = aIdx < 0;
                const bRes = bIdx < 0;
                if (aRes && !bRes) {
                    return 1;
                }
                if (!aRes && bRes) {
                    return -1;
                }
                if (aRes && bRes) {
                    return bIdx - aIdx;
                }
                if (aIdx !== bIdx) {
                    return aIdx - bIdx;
                }
                const aAct = aItem instanceof Action;
                const bAct = bItem instanceof Action;
                if (aAct && !bAct) {
                    return -1;
                }
                if (!aAct && bAct) {
                    return 1;
                }
                return aItem!.getName().localeCompare(bItem!.getName());
            }

            const aIdx = aItem ? (aItem.getIndex() ?? Infinity) : Infinity;
            const bIdx = bItem ? (bItem.getIndex() ?? Infinity) : Infinity;
            if (aIdx !== bIdx) {
                return aIdx - bIdx;
            }
            const aAct = aItem instanceof Action;
            const bAct = bItem instanceof Action;
            if (aAct && !bAct) {
                return -1;
            }
            if (!aAct && bAct) {
                return 1;
            }
            const aName = aItem ? aItem.getName() : a.getValue();
            const bName = bItem ? bItem.getName() : b.getValue();
            return aName.localeCompare(bName);
        });
    }

    /**
     * Applies layered styling to an option: per-option > menu styles > env default.
     */
    protected applyOptionStyles(option: MenuFieldOption): void {
        const os = option.getStyles();
        const ms = this.getStyles();

        // Idle
        const idlePrefix = os.getIdle()?.getPrefix() ?? ms.getIdle()?.getPrefix() ?? Utility.getDefaultIdlePrefix();
        const idleColor = os.getIdle()?.getColor() ?? ms.getIdle()?.getColor()  ?? Utility.getDefaultIdleColor();
        const idleUnderline = os.getIdle()?.isUnderline() ?? ms.getIdle()?.isUnderline() ?? Utility.getDefaultIdleUnderline();
        const idleItalic = os.getIdle()?.isItalic() ?? ms.getIdle()?.isItalic();

        option.setStyles({
            idle: { prefix: idlePrefix, color: idleColor, underline: idleUnderline, italic: idleItalic },
            hover: {
                prefix: os.getHover()?.getPrefix() ?? ms.getHover()?.getPrefix() ?? Utility.getDefaultHoverPrefix() ?? idlePrefix,
                color: os.getHover()?.getColor() ?? ms.getHover()?.getColor() ?? Utility.getDefaultHoverColor() ?? idleColor,
                underline: os.getHover()?.isUnderline() ?? ms.getHover()?.isUnderline() ?? Utility.getDefaultHoverUnderline(),
                italic: os.getHover()?.isItalic() ?? ms.getHover()?.isItalic(),
            },
            selected: {
                prefix: os.getSelected()?.getPrefix() ?? ms.getSelected()?.getPrefix() ?? Utility.getDefaultSelectedPrefix() ?? idlePrefix,
                color: os.getSelected()?.getColor() ?? ms.getSelected()?.getColor() ?? Utility.getDefaultSelectedColor() ?? idleColor,
                underline: os.getSelected()?.isUnderline() ?? ms.getSelected()?.isUnderline() ?? Utility.getDefaultSelectedUnderline(),
                italic: os.getSelected()?.isItalic() ?? ms.getSelected()?.isItalic(),
            },
        });
    }

    // helpers

    public hasChoices(): boolean {
        const resolved =
            typeof this.values === "function"
                ? (this.values as MenuFieldValuesResolvedFn)({ menu: this })
                : this.values;
        return Object.keys(resolved).length > 0;
    }

    public hasInput(): boolean {
        const ic = this.configs.getInputConfigs();
        return !!(ic?.getCallback() || ic?.getValidate() || ic?.isFastSubmit());
    }

    // values API (choice options)

    public getValues(map: boolean = false): MenuFieldOption[] | MenuFieldValuesMap {
        const values = typeof this.values === "function"
            ? (this.values as MenuFieldValuesResolvedFn)({ menu: this })
            : this.values
        ;
        return map ? values : Object.values(values);
    }

    public getValuesMap(): MenuFieldValuesMap { return this.getValues(true) as MenuFieldValuesMap; }
    public getValuesList(): MenuFieldOption[] { return this.getValues(false) as MenuFieldOption[]; }

    public getOptions(sorted: boolean = false): MenuFieldOption[] {
        return sorted ? this.sortValues() : this.getValuesList();
    }

    public getOption(name: string): MenuFieldOption | undefined {
        return this.getValuesMap()[name];
    }

    public setOption(name: string, value: MenuFieldOption): this {
        if (typeof this.values === "function") {
            const vals = (this.values as MenuFieldValuesResolvedFn)({ menu: this });
            vals[name] = value;
            this.values = vals;
        } else {
            this.values[name] = value;
        }
        return this;
    }

    public addOption(value: Menu | Action | MenuFieldOption | MenuFieldJsonValue): this {
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

    // configs API

    public getConfigs(): MenuFieldConfigs {
        return this.configs;
    }
    public setConfigs(data: MenuFieldConfigs | MenuFieldConfigsJson): this {
        this.configs = data instanceof MenuFieldConfigs ? data : new MenuFieldConfigs(data);
        return this;
    }

    // global choices

    public getGlobalChoices(): (Choice | Separator)[] {
        return this.globalChoices;
    }
    public setGlobalChoices(choices: (Choice | Separator)[]): this {
        this.globalChoices = choices;
        return this;
    }

    // toJson

    public toJson(): MenuFieldJson {
        const choicesValues = this.getValuesList().map((v) => v.toJson());
        const choiceCfg = this.configs.getChoiceConfigs();
        const inputCfg = this.configs.getInputConfigs();

        return {
            ...super.toJson(),
            type: "field" as const,
            ...(choicesValues.length > 0 ? { values: choicesValues } : {}),
            ...(choiceCfg || inputCfg ? { configs: this.configs.toJson() } : {}),
        };
    }

    // run

    public async run(language?: Language): Promise<string | string[]> {
        const hasChoicesSection = this.hasChoices() || this.globalChoices.length > 0;
        const inputCfg = this.configs.getInputConfigs();
        const labels = this.getLabels();
        const resolvedPlaceholder = (labels instanceof MenuInputLabels 
            ? labels.getPlaceholder()?.getValue(language) 
            : undefined
        ) ?? "";
        const hasInputSection = !!(
            inputCfg?.getCallback() ||
            inputCfg?.getValidate() ||
            inputCfg?.isFastSubmit() ||
            resolvedPlaceholder.length > 0
        );

        if (hasInputSection && (inputCfg?.isClear() ?? true)) {
            console.clear();
        } else if (!hasInputSection) {
            console.clear();
        }

        const choiceCfg = this.configs.getChoiceConfigs();
        const isSelectable = choiceCfg?.isSelectable() ?? false;
        const selectedValues = choiceCfg?.getSelectedValues() ?? [];
        const inputValue = inputCfg?.getValue() ?? "";

        const buildChoices = (): (Choice | Separator)[] => {
            if (!hasChoicesSection) {
                return [];
            }

            const values = this.getOptions();
            const globalIndex = values.findIndex((v) => v.getItem()?.isGlobal());
            const items: (MenuFieldOption | Separator)[] = [...values];
            if (globalIndex >= 0) {
                items.splice(globalIndex, 0, new Separator());
            }

            const choiceList: (Choice | Separator)[] = items.map((item) => {
                if (item instanceof Separator) {
                    return item;
                }

                const isSelected =
                    isSelectable &&
                    !item.getItem()?.isGlobal() &&
                    (this.getConfigs().getChoiceConfigs()?.isSelectedValue(item.getValue()) ?? false);

                return {
                    value: item.getValue(),
                    label:
                        item.getItem()?.getLabels().getTitle()?.getValue(language) ??
                        item.getLabels().getTitle()?.getValue(language) ??
                        Translations.getTranslation(item.getValue(), language),
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
            });

            if (this.globalChoices.length > 0) {
                choiceList.push(...this.globalChoices);
            }
            return choiceList;
        };

        const choiceList = buildChoices();
        if (hasChoicesSection) {
            Utility.log(
                [
                    new Date().toISOString(),
                    `${this.getName()} - ${this.getLabels().getQuestion()?.getValue(language)}`,
                    ...choiceList.map((c) => (c instanceof Separator ? c.separator : (c as Choice).label)),
                ].join("\n") + "\n"
            );
        }

        const validate = inputCfg?.getValidate();
        const translatedValidate = validate
            ? (value: string): boolean | string => {
                const res = validate(value);
                if (res === true || res === undefined) {
                    return true;
                }
                if (typeof res === "string" && res.length > 0) {
                    const asKey = Translations.getTranslation(res, language);
                    if (asKey !== res) {
                        return asKey;
                    }
                }
                return this.getLabels().getError()?.getValue(language) ?? true;
            }
            : undefined;

        const result = await prompt({
            message: this.getLabels().getQuestion()!.write({ color: this.getStyles().getIdle()?.getColor() }, language),
            ...(hasInputSection
                ? {
                      input: {
                          value: inputValue,
                          placeholder: resolvedPlaceholder,
                          fastSubmit: inputCfg?.isFastSubmit() ?? false,
                          inline: inputCfg?.isInline() ?? false,
                          validate: translatedValidate,
                      },
                  }
                : {}),
            ...(hasChoicesSection ? { choices: choiceList } : {}),
            ...(isSelectable && selectedValues.length > 0 ? { initialSelected: selectedValues } : {}),
        });

        if (result.type === "input") {
            inputCfg?.setValue(result.value);
            Utility.log(
                [new Date().toISOString(), `${this.getName()} - ${this.getLabels().getQuestion()?.getValue(language)}`, result.value].join(
                    "\n"
                ) + "\n"
            );
            return result.value;
        }

        if (result.type === "choice") {
            const picked = this.getOption(result.value);
            if (picked && !(picked.getItem() instanceof Action)) {
                choiceCfg?.setSelectedValues([result.value]);
            }
            return [result.value];
        }

        // result.type === 'choices' (multi)
        const nonActionSelected = result.values.filter((val: string) => {
            const option = this.getOption(val);
            return option ? !(option.getItem() instanceof Action) : true;
        });
        if (nonActionSelected.length > 0) {
            choiceCfg?.setSelectedValues(nonActionSelected);
        }
        return result.values;
    }
}

export {
    type MenuFieldJson,
    type MenuFieldOptionJson,
    type MenuFieldJsonValue,
    MenuField,
    MenuFieldOption,
    MenuFieldConfigs,
    type MenuFieldConfigsJson,
};
