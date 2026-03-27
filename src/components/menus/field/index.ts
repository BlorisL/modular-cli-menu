import { Menu, MenuJson } from "../menu";
import { Action } from "../../actions";
import { Language, Translations } from "../../translations";
import { Utility } from "../../utility";
import { prompt, Choice, Separator } from "@/prompts/Prompt";
import { MenuFieldOption, MenuFieldOptionJson } from "./option";
import { MenuFieldConfigs, MenuFieldConfigsJson } from "./configs";
import { MenuChoiceConfigs } from "../choice/config";
import { MenuInputConfigs } from "../input/config";

// ── JSON types

type MenuFieldJsonValue = string | MenuFieldOptionJson;

type MenuFieldJson = Omit<MenuJson, "type"> & {
    type: "field";
    values?: Array<MenuFieldJsonValue> | ((data: { menu: MenuField }) => Array<MenuFieldJsonValue>);
    configs?: MenuFieldConfigsJson;
};

// ── Internal types

type MenuFieldValuesMap = Record<string, MenuFieldOption>;
type MenuFieldValuesFn = (data: { menu: MenuField }) => Array<MenuFieldJsonValue>;
type MenuFieldValuesResolvedFn = (data: { menu: MenuField }) => MenuFieldValuesMap;

// ── MenuField

class MenuField extends Menu {
    protected type: MenuJson["type"] = "field";

    // choice values
    protected values: MenuFieldValuesMap | MenuFieldValuesResolvedFn = {};

    // single config container
    protected configs: MenuFieldConfigs = new MenuFieldConfigs();

    // runtime
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
                            option = new MenuFieldOption(v.value, v.label, v.multi, v.idle, v.hover, v.selected);
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

    // ── internals

    protected resolveValues(): MenuFieldValuesMap {
        return typeof this.values === "function"
            ? (this.values as MenuFieldValuesResolvedFn)({ menu: this })
            : this.values;
    }

    protected sortValues(): MenuFieldOption[] {
        return Object.values(this.resolveValues()).sort((a, b) => {
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
        // ── Idle
        option.setIdlePrefix(option.getIdlePrefix() ?? this.idle?.getPrefix() ?? Utility.getDefaultIdlePrefix());
        option.setIdleColor(option.getIdleColor() ?? this.idle?.getColor() ?? Utility.getDefaultIdleColor());
        const idleUnderline = option.isIdleUnderline() ?? this.idle?.isUnderline() ?? Utility.getDefaultIdleUnderline();
        if (idleUnderline !== undefined) {
            option.setIdleUnderline(idleUnderline);
        }
        const idleItalic = option.isIdleItalic() ?? this.idle?.isItalic();
        if (idleItalic !== undefined) {
            option.setIdleItalic(idleItalic);
        }

        // ── Hover
        option.setHoverPrefix(
            option.getHoverPrefix() ??
                this.hover?.getPrefix() ??
                Utility.getDefaultHoverPrefix() ??
                option.getIdlePrefix()
        );
        option.setHoverColor(
            option.getHoverColor() ?? this.hover?.getColor() ?? Utility.getDefaultHoverColor() ?? option.getIdleColor()
        );
        const hoverUnderline =
            option.isHoverUnderline() ?? this.hover?.isUnderline() ?? Utility.getDefaultHoverUnderline();
        if (hoverUnderline !== undefined) {
            option.setHoverUnderline(hoverUnderline);
        }
        const hoverItalic = option.isHoverItalic() ?? this.hover?.isItalic();
        if (hoverItalic !== undefined) {
            option.setHoverItalic(hoverItalic);
        }

        // ── Selected
        option.setSelectedPrefix(
            option.getSelectedPrefix() ??
                this.selected?.getPrefix() ??
                Utility.getDefaultSelectedPrefix() ??
                option.getIdlePrefix()
        );
        option.setSelectedColor(
            option.getSelectedColor() ??
                this.selected?.getColor() ??
                Utility.getDefaultSelectedColor() ??
                option.getIdleColor()
        );
        const selectedUnderline =
            option.isSelectedUnderline() ?? this.selected?.isUnderline() ?? Utility.getDefaultSelectedUnderline();
        if (selectedUnderline !== undefined) {
            option.setSelectedUnderline(selectedUnderline);
        }
        const selectedItalic = option.isSelectedItalic() ?? this.selected?.isItalic();
        if (selectedItalic !== undefined) {
            option.setSelectedItalic(selectedItalic);
        }
    }

    // ── mode helpers

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

    // ── values API (choice options)

    public getOptions(): MenuFieldOption[] {
        return this.sortValues();
    }

    public getOption(name: string): MenuFieldOption | undefined {
        return this.resolveValues()[name];
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
            option = new MenuFieldOption(
                value,
                value.getName(),
                false,
                value.getIdle()?.toJson(),
                value.getHover()?.toJson(),
                value.getSelected()?.toJson()
            );
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
                value.label,
                value.multi,
                value.idle,
                value.hover,
                value.selected
            );
        }

        if (name && option) {
            this.applyOptionStyles(option);
            this.setOption(name, option);
        }

        return this;
    }

    // ── selected values API (delegates to choice configs)

    public getSelectedValues(): string[] {
        return this.configs.getChoiceConfigs()?.getSelectedValues() ?? [];
    }
    public setSelectedValues(values: string[]): this {
        this.configs.getChoiceConfigs()?.setSelectedValues(values);
        return this;
    }
    public addSelectedValue(value: string): this {
        this.configs.getChoiceConfigs()?.addSelectedValue(value);
        return this;
    }
    public delSelectedValue(value: string): this {
        this.configs.getChoiceConfigs()?.delSelectedValue(value);
        return this;
    }
    public isSelectedValue(value: string): boolean {
        return this.configs.getChoiceConfigs()?.isSelectedValue(value) ?? false;
    }

    // ── input value API (delegates to input configs)

    public getInputValue(): string {
        return this.configs.getInputConfigs()?.getValue() ?? "";
    }
    public setInputValue(value: string): this {
        this.configs.getInputConfigs()?.setValue(value);
        return this;
    }

    // ── configs API

    public getConfigs(): MenuFieldConfigs {
        return this.configs;
    }
    public setConfigs(data: MenuFieldConfigs | MenuFieldConfigsJson): this {
        this.configs = data instanceof MenuFieldConfigs ? data : new MenuFieldConfigs(data);
        return this;
    }

    /** Shortcut for getConfigs().getChoiceConfigs() */
    public getChoiceConfigs(): MenuChoiceConfigs | undefined {
        return this.configs.getChoiceConfigs();
    }
    /** Shortcut for getConfigs().getInputConfigs() */
    public getInputConfigs(): MenuInputConfigs | undefined {
        return this.configs.getInputConfigs();
    }

    // ── placeholder label

    public getPlaceholderName(): string {
        return `${this.getPlugin() ?? "default"}.${this.getName()}.placeholder`;
    }

    public getPlaceholderLabel(language?: Language): string {
        const placeholder = this.configs.getInputConfigs()?.getPlaceholder() ?? "";
        if (placeholder.length > 0) {
            return Translations.getTranslation(placeholder, language) ?? placeholder;
        }
        const key = this.getPlaceholderName();
        const translated = Translations.getTranslation(key, language);
        return translated !== key ? translated : key;
    }

    // ── global choices

    public getGlobalChoices(): (Choice | Separator)[] {
        return this.globalChoices;
    }
    public setGlobalChoices(choices: (Choice | Separator)[]): this {
        this.globalChoices = choices;
        return this;
    }

    // ── toJson

    public toJson(): MenuFieldJson {
        const choicesValues = Object.values(this.resolveValues()).map((v) => v.toJson());
        const choiceCfg = this.configs.getChoiceConfigs();
        const inputCfg = this.configs.getInputConfigs();

        return {
            ...super.toJson(),
            type: "field" as const,
            ...(choicesValues.length > 0 ? { values: choicesValues } : {}),
            ...(choiceCfg || inputCfg ? { configs: this.configs.toJson() } : {}),
        };
    }

    // ── run

    public async run(language?: Language): Promise<string | string[]> {
        const hasChoicesSection = this.hasChoices() || this.globalChoices.length > 0;
        const inputCfg = this.configs.getInputConfigs();
        const placeholder = inputCfg?.getPlaceholder() ?? "";
        const hasInputSection = !!(
            inputCfg?.getCallback() ||
            inputCfg?.getValidate() ||
            inputCfg?.isFastSubmit() ||
            placeholder
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

                const isSelected = isSelectable && !item.getItem()?.isGlobal() && this.isSelectedValue(item.getValue());

                return {
                    value: item.getValue(),
                    label:
                        item.getItem()?.getTitleLabel(language) ??
                        Translations.getTranslation(item.getLabel() ?? item.getValue(), language),
                    multi: item.isMulti(),
                    ...(item.getIdle()
                        ? {
                              idle: {
                                  prefix: item.getIdlePrefix(),
                                  color: item.getIdleColor(),
                                  underline: item.isIdleUnderline(),
                                  italic: item.isIdleItalic(),
                              },
                          }
                        : {}),
                    ...(item.getHover()
                        ? {
                              hover: {
                                  prefix: item.getHoverPrefix(),
                                  color: item.getHoverColor(),
                                  underline: item.isHoverUnderline(),
                                  italic: item.isHoverItalic(),
                              },
                          }
                        : {}),
                    ...(item.getSelected()
                        ? {
                              selected: {
                                  prefix: item.getSelectedPrefix(),
                                  color: item.getSelectedColor(),
                                  underline: item.isSelectedUnderline(),
                                  italic: item.isSelectedItalic(),
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
                    `${this.getName()} - ${this.getQuestionLabel(language)}`,
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
                  return this.getErrorLabel(language);
              }
            : undefined;

        const result = await prompt({
            message: Utility.write(this.getQuestionLabel(language), this.idle?.getColor()),
            ...(hasInputSection
                ? {
                      input: {
                          value: inputValue,
                          placeholder: this.getPlaceholderLabel(language),
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
                [new Date().toISOString(), `${this.getName()} - ${this.getQuestionLabel(language)}`, result.value].join(
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
