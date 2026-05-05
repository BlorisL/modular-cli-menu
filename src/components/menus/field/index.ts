import { Menu, MenuJson, MenuLabelsJson } from "@/components/menus/menu";
import { Action } from "@/components/actions";
import { Language, Translations } from "@/components/translations";
import { Utility } from "@/components/utility";
import { prompt, Choice, Separator } from "@/prompts/Prompt";
import { MenuFieldOption, MenuFieldOptionJson } from "@/components/menus/field/option";
import { MenuFieldConfigs, MenuFieldConfigsJson } from "@/components/menus/field/configs";
import { MenuChoice, MenuChoiceJson, MenuChoiceJsonValue } from "@/components/menus/choice";
import { MenuInput } from "@/components/menus/input";

// JSON types

type MenuFieldJsonValue = MenuChoiceJsonValue;

type MenuFieldJson = Omit<MenuJson, "type" | "labels"> & {
    type: "field";
    labels?: MenuLabelsJson;
    values?: Array<MenuFieldJsonValue> | ((data: { menu: MenuChoice }) => Array<MenuFieldJsonValue>);
    configs?: MenuFieldConfigsJson;
};

// MenuField — aggregates MenuChoice (options) + MenuInput (text value)

class MenuField extends Menu {
    protected type: MenuJson["type"] = "field";
    protected choice?: MenuChoice;
    protected input?: MenuInput;
    protected globalChoices: (Choice | Separator)[] = [];

    /**
     * Creates a new field menu (composite choice+input menu) from JSON.
     * @param data Menu JSON including name, type, optional choice/input values and configs.
     */
    constructor(data: MenuFieldJson) {
        super(data);

        if (data.values !== undefined || data.configs?.choice) {
            this.choice = new MenuChoice({
                name: data.name,
                plugin: data.plugin,
                global: data.global,
                index: data.index,
                parents: data.parents,
                styles: data.styles,
                labels: data.labels,
                type: "choice",
                values: data.values as MenuChoiceJson["values"],
                configs: data.configs?.choice,
            });
        }

        if (data.configs?.input) {
            this.input = new MenuInput({
                name: data.name,
                plugin: data.plugin,
                type: "input",
                configs: data.configs.input,
            });
        }
    }

    // internal components access

    /** Returns the underlying choice menu if configured, or undefined. */
    public getChoice(): MenuChoice | undefined {
        return this.choice;
    }

    /** Returns the underlying input menu if configured, or undefined. */
    public getInput(): MenuInput | undefined {
        return this.input;
    }

    // helpers

    /** Returns true when a choice menu has been configured. */
    public hasChoices(): boolean {
        return !!this.choice?.hasChoices() || this.globalChoices.length > 0;
    }

    /** Returns true when an input menu has been configured. */
    public hasInput(): boolean {
        return !!this.input;
    }

    // options API — delegates to internal MenuChoice

    /**
     * Returns an option by name from the choice menu, or undefined if not found.
     * @param name Option value/name to look up.
     */
    public getOption(name: string): MenuFieldOption | undefined {
        return this.choice?.getOption(name);
    }

    /**
     * Returns the option list from the choice menu, optionally sorted for display.
     * @param sorted When true, applies the display-order sorting algorithm.
     */
    public getOptions(sorted = false): MenuFieldOption[] {
        return this.choice?.getOptions(sorted) ?? [];
    }

    /** Returns the currently selected option names from the choice menu. */
    public getSelectedValues(): string[] {
        return this.choice?.getSelectedValues() ?? [];
    }

    /**
     * Adds an option to the choice menu.
     * @param value The option to add (Menu, Action, MenuFieldOption, or raw JSON value).
     */
    public addOption(value: Menu | Action | MenuFieldOption | MenuFieldJsonValue): this {
        if (this.choice) {
            this.choice.addOption(value);
        }
        return this;
    }

    // global choices (input sidebar)

    /** Returns the global sidebar choices rendered alongside the menu. */
    public getGlobalChoices(): (Choice | Separator)[] {
        return this.globalChoices;
    }

    /**
     * Replaces the global sidebar choices.
     * @param choices Array of Choice or Separator items.
     */
    public setGlobalChoices(choices: (Choice | Separator)[]): this {
        this.globalChoices = choices;
        return this;
    }

    // toJson

    /** Serialises this field menu to a plain JSON-compatible object. */
    public toJson(): MenuFieldJson {
        return {
            ...super.toJson(),
            type: "field" as const,
            ...(this.choice?.getOptions().length ? { values: this.choice.getValuesList().map((v) => v.toJson()) } : {}),
            ...(this.choice?.getConfigs() || this.input
                ? {
                        configs: new MenuFieldConfigs({
                            choice: this.choice?.getConfigs().toJson(),
                            input: this.input?.getConfigs().toJson(),
                        }).toJson(),
                    }
                : {}),
        };
    }

    // run (combined: choice + input in one prompt)

    /**
     * Renders and runs the field menu (choice + optional input).
     * @param language Optional language override for label translation.
     */
    public async run(language?: Language): Promise<string | string[]> {
        const inputCfg = this.input?.getConfigs();
        const resolvedPlaceholder = this.input?.getLabels().getPlaceholder()?.getValue(language);

        const hasInputSection = !!(
            inputCfg?.getCallback()
            || inputCfg?.getValidate()
            || inputCfg?.isFastSubmit()
            || resolvedPlaceholder
        );
        const hasChoicesSection = this.hasChoices();

        if (hasInputSection && (inputCfg?.isClear() ?? true)) {
            console.clear();
        } else if (!hasInputSection) {
            console.clear();
        }

        const isSelectable = this.choice?.getConfigs().isSelectable() ?? false;
        const selectedValues = this.choice?.getSelectedValues() ?? [];
        const inputValue = this.input?.getValue();

        const buildChoices = (): (Choice | Separator)[] => {
            let choicesResult: (Choice | Separator)[];
            if (hasChoicesSection) {
                const values = this.choice?.getOptions() ?? [];
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
                            isSelectable
                            && !item.getItem()?.isGlobal()
                            && (this.choice?.isSelectedValue(item.getValue()) ?? false);

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

                if (this.globalChoices.length > 0) {
                    choiceList.push(...this.globalChoices);
                }
                choicesResult = choiceList;
            } else {
                choicesResult = [];
            }
            return choicesResult;
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
                    let result: boolean | string;
                    if (res === true || res === undefined) {
                        result = true;
                    } else if (typeof res === "string" && res.length > 0) {
                        const asKey = Translations.getTranslation(res, language);
                        if (asKey !== res) {
                            result = asKey;
                        } else {
                            result = this.getLabels().getError()?.getValue(language) ?? true;
                        }
                    } else {
                        result = this.getLabels().getError()?.getValue(language) ?? true;
                    }
                    return result;
                }
            : undefined
        ;
        const result = await prompt({
            message: this.getLabels().getQuestion()!.write({ color: this.getStyles().getIdle()?.getColor(), language }),
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
            this.input?.setValue(result.value);
            Utility.log(
                [
                    new Date().toISOString(),
                    `${this.getName()} - ${this.getLabels().getQuestion()?.getValue(language)}`,
                    result.value,
                ].join("\n") + "\n"
            );
            return result.value;
        }

        if (result.type === "choice") {
            const picked = this.choice?.getOption(result.value);
            if (picked && !(picked.getItem() instanceof Action)) {
                this.choice?.setSelectedValues([result.value]);
            }
            return [result.value];
        }

        // result.type === "choices" (multi)
        const nonActionSelected = result.values.filter((val: string) => {
            const option = this.choice?.getOption(val);
            return option ? !(option.getItem() instanceof Action) : true;
        });
        if (nonActionSelected.length > 0) {
            this.choice?.setSelectedValues(nonActionSelected);
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
