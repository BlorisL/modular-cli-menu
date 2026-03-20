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
    protected type: MenuFieldJson["type"] = "field";

    // shared state
    protected values: MenuFieldValuesMap | MenuFieldValuesResolvedFn = {};
    protected selectedValues: string[] = [];

    // single config container
    protected configs: MenuFieldConfigs = new MenuFieldConfigs();

    // runtime
    protected globalChoices: (Choice | Separator)[] = [];
    protected lastParent: string | undefined;

    constructor(data: MenuFieldJson) {
        super(data);

        // ── configs
        if (data.configs) {
            this.configs = new MenuFieldConfigs(data.configs);
        }
        this.setSelectedValues(this.configs.getChoiceConfigs()?.getDefaults()?.getValues() ?? []);

        // ── choice values
        if (data.values) {
            if (Array.isArray(data.values)) {
                data.values.forEach((v) => this.addValue(v));
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

    /**
     * Applies layered styling to an option.
     * Normal items  → per-option > menu config > env default
     * Global items  → per-option > env default only (menu config always skipped)
     */
    protected applyOptionStyles(option: MenuFieldOption): void {
        const isGlobal = option.getItem()?.isGlobal() ?? false;
        const cfg = this.configs.getChoiceConfigs();

        // ── Idle
        const idlePrefix = isGlobal
            ? (option.getIdlePrefix() ?? Utility.getDefaultIdlePrefix())
            : (option.getIdlePrefix() ?? cfg?.getIdle()?.getPrefix() ?? Utility.getDefaultIdlePrefix());
        const idleColor = isGlobal
            ? (option.getIdleColor() ?? Utility.getDefaultIdleColor())
            : (option.getIdleColor() ?? cfg?.getIdle()?.getColor() ?? Utility.getDefaultIdleColor());
        const idleUnderline = isGlobal
            ? (option.isIdleUnderline() ?? Utility.getDefaultIdleUnderline())
            : (option.isIdleUnderline() ?? cfg?.getIdle()?.isUnderline() ?? Utility.getDefaultIdleUnderline());
        const idleItalic = isGlobal
            ? option.isIdleItalic()
            : (option.isIdleItalic() ?? cfg?.getIdle()?.isItalic());

        option.setIdlePrefix(idlePrefix);
        option.setIdleColor(idleColor);
        if (idleUnderline !== undefined) option.setIdleUnderline(idleUnderline);
        if (idleItalic !== undefined) option.setIdleItalic(idleItalic);

        // ── Hover
        const hoverPrefix = isGlobal
            ? (option.getHoverPrefix() ?? Utility.getDefaultHoverPrefix() ?? idlePrefix)
            : (option.getHoverPrefix() ?? cfg?.getHover()?.getPrefix() ?? Utility.getDefaultHoverPrefix() ?? idlePrefix);
        const hoverColor = isGlobal
            ? (option.getHoverColor() ?? Utility.getDefaultHoverColor() ?? idleColor)
            : (option.getHoverColor() ?? cfg?.getHover()?.getColor() ?? Utility.getDefaultHoverColor() ?? idleColor);
        const hoverUnderline = isGlobal
            ? (option.isHoverUnderline() ?? Utility.getDefaultHoverUnderline())
            : (option.isHoverUnderline() ?? cfg?.getHover()?.isUnderline() ?? Utility.getDefaultHoverUnderline());
        const hoverItalic = isGlobal
            ? option.isHoverItalic()
            : (option.isHoverItalic() ?? cfg?.getHover()?.isItalic());

        option.setHoverPrefix(hoverPrefix);
        option.setHoverColor(hoverColor);
        if (hoverUnderline !== undefined) option.setHoverUnderline(hoverUnderline);
        if (hoverItalic !== undefined) option.setHoverItalic(hoverItalic);

        // ── Selected
        const selectedPrefix = isGlobal
            ? (option.getSelectedPrefix() ?? Utility.getDefaultSelectedPrefix() ?? idlePrefix)
            : (option.getSelectedPrefix() ?? cfg?.getSelected()?.getPrefix() ?? Utility.getDefaultSelectedPrefix() ?? idlePrefix);
        const selectedColor = isGlobal
            ? (option.getSelectedColor() ?? Utility.getDefaultSelectedColor() ?? idleColor)
            : (option.getSelectedColor() ?? cfg?.getSelected()?.getColor() ?? Utility.getDefaultSelectedColor() ?? idleColor);
        const selectedUnderline = isGlobal
            ? (option.isSelectedUnderline() ?? Utility.getDefaultSelectedUnderline())
            : (option.isSelectedUnderline() ?? cfg?.getSelected()?.isUnderline() ?? Utility.getDefaultSelectedUnderline());
        const selectedItalic = isGlobal
            ? option.isSelectedItalic()
            : (option.isSelectedItalic() ?? cfg?.getSelected()?.isItalic());

        option.setSelectedPrefix(selectedPrefix);
        option.setSelectedColor(selectedColor);
        if (selectedUnderline !== undefined) option.setSelectedUnderline(selectedUnderline);
        if (selectedItalic !== undefined) option.setSelectedItalic(selectedItalic);
    }

    // ── mode helpers

    public hasChoices(): boolean {
        const resolved = typeof this.values === "function"
            ? (this.values as MenuFieldValuesResolvedFn)({ menu: this })
            : this.values;
        return Object.keys(resolved).length > 0;
    }

    public hasInput(): boolean {
        const ic = this.configs.getInputConfigs();
        return !!(ic?.getCallback() || ic?.getValidate() || ic?.isFastSubmit());
    }

    // ── values API

    public getValues(): MenuFieldOption[] { return this.sortValues(); }

    public getValue(name: string): MenuFieldOption | undefined {
        return this.resolveValues()[name];
    }

    public setValue(name: string, value: MenuFieldOption): this {
        if (typeof this.values === "function") {
            const vals = (this.values as MenuFieldValuesResolvedFn)({ menu: this });
            vals[name] = value;
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
            name = value.getName();
            option = new MenuFieldOption(value, value.getName(), false, value.getIdle()?.toJson(), value.getHover()?.toJson(), value.getSelected()?.toJson());
        } else if (value instanceof MenuFieldOption) {
            name = value.getValue();
            option = value;
        } else if (typeof value === "string") {
            name = value;
            option = new MenuFieldOption(value);
        } else if (typeof value === "object") {
            name = value.value;
            option = new MenuFieldOption(value.value, value.label, value.multi, value.idle, value.hover, value.selected);
        }

        if (name && option) {
            this.applyOptionStyles(option);
            this.setValue(name, option);
        }

        return this;
    }

    // ── selected values API

    public setSelectedValues(values: string[]): this { this.selectedValues = values; return this; }
    public getSelectedValues(): string[] { return this.selectedValues; }
    public addSelectedValue(value: string): this {
        if (!this.selectedValues.includes(value)) this.selectedValues.push(value);
        return this;
    }
    public delSelectedValue(value: string): this {
        this.selectedValues = this.selectedValues.filter((v) => v !== value);
        return this;
    }
    public isSelectedValue(value: string): boolean { return this.selectedValues.includes(value); }

    // ── configs API

    public getConfigs(): MenuFieldConfigs { return this.configs; }
    public setConfigs(data: MenuFieldConfigs | MenuFieldConfigsJson): this {
        this.configs = data instanceof MenuFieldConfigs ? data : new MenuFieldConfigs(data);
        return this;
    }

    public isConfigDefaults(): boolean { return !!this.configs.getChoiceConfigs()?.getDefaults(); }
    public isConfigIdle(): boolean { return !!this.configs.getChoiceConfigs()?.getIdle(); }
    public isConfigHover(): boolean { return !!this.configs.getChoiceConfigs()?.getHover(); }
    public isConfigSelected(): boolean { return !!this.configs.getChoiceConfigs()?.getSelected(); }
    public isDefaultValues(value: string): boolean {
        return this.configs.getChoiceConfigs()?.getDefaults()?.getValues().includes(value) ?? false;
    }

    /** Shortcut for getConfigs().getChoiceConfigs() */
    public getChoiceConfigs(): MenuChoiceConfigs | undefined { return this.configs.getChoiceConfigs(); }
    /** Shortcut for getConfigs().getInputConfigs() */
    public getInputConfigs(): MenuInputConfigs | undefined { return this.configs.getInputConfigs(); }

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

    public getGlobalChoices(): (Choice | Separator)[] { return this.globalChoices; }
    public setGlobalChoices(choices: (Choice | Separator)[]): this { this.globalChoices = choices; return this; }

    public getLastParent(): string | undefined { return this.lastParent; }
    public setLastParent(parent: string): this { this.lastParent = parent; return this; }

    // ── toJson

    public toJson(): MenuFieldJson {
        const choicesValues = Object.values(this.resolveValues())
            .filter((v) => v.getValue() !== "")
            .map((v) => v.toJson());
        const choiceCfg = this.configs.getChoiceConfigs();
        const inputCfg = this.configs.getInputConfigs();

        return {
            ...super.toJson(),
            type: this.type,
            ...(choicesValues.length > 0 ? { values: choicesValues } : {}),
            ...(choiceCfg || inputCfg
                ? { configs: this.configs.toJson() }
                : {}),
        };
    }

    // ── run

    public async run(language?: Language): Promise<string | string[]> {
        const hasChoicesSection = this.hasChoices() || this.globalChoices.length > 0;
        const inputCfg = this.configs.getInputConfigs();
        const placeholder = inputCfg?.getPlaceholder() ?? "";
        const hasInputSection = !!(inputCfg?.getCallback() || inputCfg?.getValidate() || inputCfg?.isFastSubmit() || placeholder);

        if (hasInputSection && (inputCfg?.isClear() ?? true)) {
            console.clear();
        } else if (!hasInputSection) {
            console.clear();
        }

        const isSelectable = this.configs.getChoiceConfigs()?.isSelectable() ?? false;

        // Build choices list
        const buildChoices = (): (Choice | Separator)[] => {
            if (!hasChoicesSection) return [];

            const values = this.getValues();
            const globalIndex = values.findIndex((v) => v.getItem()?.isGlobal());
            const items: (MenuFieldOption | Separator)[] = [...values];
            if (globalIndex >= 0) items.splice(globalIndex, 0, new Separator());

            const choiceList: (Choice | Separator)[] = items.map((item) => {
                if (item instanceof Separator) return item;

                const isSelected = isSelectable && !item.getItem()?.isGlobal() && this.isSelectedValue(item.getValue());

                return {
                    value: item.getValue(),
                    label:
                        item.getItem()?.getTitleLabel(language) ??
                        Translations.getTranslation(item.getLabel() ?? item.getValue(), language),
                    multi: item.isMulti(),
                    ...(item.getIdle() ? { idle: { prefix: item.getIdlePrefix(), color: item.getIdleColor(), underline: item.isIdleUnderline(), italic: item.isIdleItalic() } } : {}),
                    ...(item.getHover() ? { hover: { prefix: item.getHoverPrefix(), color: item.getHoverColor(), underline: item.isHoverUnderline(), italic: item.isHoverItalic() } } : {}),
                    ...(item.getSelected() ? { selected: { prefix: item.getSelectedPrefix(), color: item.getSelectedColor(), underline: item.isSelectedUnderline(), italic: item.isSelectedItalic(), active: isSelected } } : {}),
                };
            });

            if (this.globalChoices.length > 0) choiceList.push(...this.globalChoices);
            return choiceList;
        };

        const choiceList = buildChoices();
        if (hasChoicesSection) {
            Utility.log(
                [
                    new Date().toISOString(),
                    `${this.getName()} - ${this.getQuestionLabel(language)}`,
                    ...choiceList.map((c) => c instanceof Separator ? c.separator : (c as Choice).label),
                ].join("\n") + "\n"
            );
        }

        const validate = inputCfg?.getValidate();
        const translatedValidate = validate
            ? (value: string): boolean | string => {
                  const res = validate(value);
                  if (res === true || res === undefined) return true;
                  if (typeof res === "string" && res.length > 0) {
                      const asKey = Translations.getTranslation(res, language);
                      if (asKey !== res) return asKey;
                  }
                  return this.getErrorLabel(language);
              }
            : undefined;

        const result = await prompt({
            message: Utility.write(this.getQuestionLabel(language), this.idle?.getColor()),
            ...(hasInputSection
                ? {
                      input: {
                          value: this.getValue("")?.getLabel() ?? "",
                          placeholder: this.getPlaceholderLabel(language),
                          fastSubmit: inputCfg?.isFastSubmit() ?? false,
                          inline: inputCfg?.isInline() ?? false,
                          validate: translatedValidate,
                      },
                  }
                : {}),
            ...(hasChoicesSection ? { choices: choiceList } : {}),
            ...(isSelectable && this.selectedValues.length > 0 ? { initialSelected: this.selectedValues } : {}),
        });

        if (result.type === "input") {
            if (result.value !== "") {
                (this.values as MenuFieldValuesMap)[""] = new MenuFieldOption("", result.value);
            } else {
                delete (this.values as MenuFieldValuesMap)[""];
            }
            Utility.log([new Date().toISOString(), `${this.getName()} - ${this.getQuestionLabel(language)}`, result.value].join("\n") + "\n");
            return result.value;
        }

        if (result.type === "choice") {
            const picked = this.getValue(result.value);
            if (picked && !(picked.getItem() instanceof Action)) {
                this.setSelectedValues([result.value]);
            }
            return [result.value];
        }

        // result.type === 'choices' (multi)
        const nonActionSelected = result.values.filter((val: string) => {
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
    MenuField,
    MenuFieldOption,
    MenuFieldConfigs,
    type MenuFieldConfigsJson,
};