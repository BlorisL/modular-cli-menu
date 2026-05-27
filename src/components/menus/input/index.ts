import { Menu, MenuJson } from "@/components/menus/menu";
import { Language, Translations } from "@/components/translations";
import { Utility } from "@/components/utility";
import { prompt, Choice, Separator } from "@/prompts/Prompt";
import { MenuInputLabels, MenuInputLabelsJson } from "@/components/menus/input/labels";
import { MenuInputConfigs, MenuInputConfigsJson } from "@/components/menus/input/config";

type MenuInputJson = Omit<MenuJson, "type" | "labels"> & {
    type: "input";
    labels?: MenuInputLabelsJson;
    value?: string;
    configs?: MenuInputConfigsJson;
};

class MenuInput extends Menu {
    protected type: MenuJson["type"] = "input";
    protected labels!: MenuInputLabels;
    protected value: string = "";
    protected configs: MenuInputConfigs = new MenuInputConfigs();
    protected globalChoices: (Choice | Separator)[] = [];

    /**
     * Creates a new input menu with optional pre-configured value and callbacks.
     * @param data Menu JSON including name, type, optional value, and input-specific configs.
     */
    constructor(data: MenuInputJson) {
        super(data);
        this.configs = data.configs ? new MenuInputConfigs(data.configs) : new MenuInputConfigs();

        const il = data.labels;
        const plugin = this.getPlugin() ?? "default";
        const name = this.getName();
        this.labels = new MenuInputLabels({
            question: this.labels.getQuestion()?.getName(),
            title: this.labels.getTitle()?.getName(),
            success: this.labels.getSuccess()?.getName(),
            error: this.labels.getError()?.getName(),
            answer: this.labels.getAnswer()?.getName(),
            placeholder: il?.placeholder ?? `${plugin}.${name}.placeholder`,
        });

        if (data.value !== undefined) {
            this.value = data.value;
        }
    }

    // value API

    /** Returns the current input value (the user's last answer). */
    public getValue(): string {
        return this.value;
    }

    /**
     * Overrides the stored input value.
     * @param v New value string.
     */
    public setValue(v: string): this {
        this.value = v;
        return this;
    }

    // global choices (sidebar)

    /** Returns the global sidebar choices rendered alongside the prompt. */
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

    // configs API

    /** Returns the configs object for this input menu. */
    public getConfigs(): MenuInputConfigs {
        return this.configs;
    }

    /**
     * Sets the configs from an instance or a plain JSON object.
     * @param data MenuInputConfigs instance or compatible JSON.
     */
    public setConfigs(data: MenuInputConfigs): this;
    public setConfigs(data: MenuInputConfigsJson): this;
    public setConfigs(data: MenuInputConfigs | MenuInputConfigsJson): this {
        this.configs = data instanceof MenuInputConfigs ? data : new MenuInputConfigs(data);
        return this;
    }

    // labels

    /** Returns the input-specific labels (extends MenuLabels with placeholder). */
    public override getLabels(): MenuInputLabels {
        return this.labels;
    }

    /**
     * Returns the translated placeholder string, or undefined if not set.
     * @param language Optional language override.
     */
    public getPlaceholder(language?: Language): string | undefined {
        return this.labels.getPlaceholder()?.getValue(language);
    }

    /** Returns the validation function, or undefined if not configured. */
    public getValidate(): MenuInputConfigsJson["validate"] {
        return this.configs.getValidate();
    }

    /** Returns the submission callback, or undefined if not configured. */
    public getCallback(): MenuInputConfigsJson["callback"] {
        return this.configs.getCallback();
    }

    // toJson

    /** Serialises this input menu to a plain JSON-compatible object. */
    public toJson(): MenuInputJson {
        return {
            ...super.toJson(),
            type: "input" as const,
            ...(this.value ? { value: this.value } : {}),
            ...(Object.keys(this.configs.toJson()).length > 0 ? { configs: this.configs.toJson() } : {}),
        };
    }

    // run

    /**
     * Renders and runs the interactive input prompt.
     * @param language Optional language override for label translation.
     */
    public async run(language?: Language): Promise<string | string[]> {
        const labels = this.getLabels();
        const resolvedPlaceholder = this.getPlaceholder(language);

        if (this.configs.isClear() ?? true) {
            console.clear();
        }

        const validate = this.configs.getValidate();
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
                            result = labels.getError()?.getValue(language) ?? true;
                        }
                    } else {
                        result = labels.getError()?.getValue(language) ?? true;
                    }
                    return result;
                }
            : undefined
        ;
        const result = await prompt({
            message: this.getLabels().getQuestion()!.write({ color: this.getStyles().getIdle()?.getColor(), language }),
            input: {
                value: this.value,
                placeholder: resolvedPlaceholder,
                fastSubmit: this.configs.isFastSubmit() ?? false,
                inline: this.configs.isInline() ?? false,
                validate: translatedValidate,
                forbidChars: this.configs.getForbidChars(),
            },
            ...(this.globalChoices.length > 0 ? { choices: this.globalChoices } : {}),
        });

        if (result.type === "input") {
            this.value = result.value;
            Utility.log(
                [
                    new Date().toISOString(),
                    `${this.getName()} - ${labels.getQuestion()?.getValue(language)}`,
                    result.value,
                ].join("\n") + "\n"
            );
            return result.value;
        }

        // User selected from globalChoices sidebar
        return result.type === "choices" ? result.values : [result.value];
    }
}

export {
    type MenuInputJson,
    type MenuInputLabelsJson,
    type MenuInputConfigsJson,
    MenuInput,
    MenuInputLabels,
    MenuInputConfigs,
};
