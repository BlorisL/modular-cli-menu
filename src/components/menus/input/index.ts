import { Menu, MenuJson } from "@/components/menus/menu";
import { Language, Translations } from "@/components/translations";
import { Utility } from "@/components/utility";
import { prompt, Choice, Separator } from "@/prompts/Prompt";
import { MenuInputLabels, MenuInputLabelsJson } from "./labels";
import { MenuInputConfigs, MenuInputConfigsJson } from "./config";

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

    constructor(data: MenuInputJson) {
        super(data);
        this.configs = data.configs ? new MenuInputConfigs(data.configs) : new MenuInputConfigs();

        const il = data.labels;
        const plugin = this.getPlugin() ?? "default";
        const name = this.getName();
        this.labels = new MenuInputLabels({
            question:    this.labels.getQuestion()?.getName(),
            title:       this.labels.getTitle()?.getName(),
            success:     this.labels.getSuccess()?.getName(),
            error:       this.labels.getError()?.getName(),
            answer:      this.labels.getAnswer()?.getName(),
            placeholder: il?.placeholder ?? `${plugin}.${name}.placeholder`,
        });

        if (data.value !== undefined) {
            this.value = data.value;
        }
    }

    // value API

    public getValue(): string { return this.value; }
    public setValue(v: string): this { this.value = v; return this; }

    // global choices (sidebar)

    public getGlobalChoices(): (Choice | Separator)[] { return this.globalChoices; }
    public setGlobalChoices(choices: (Choice | Separator)[]): this { this.globalChoices = choices; return this; }

    // configs API

    public getConfigs(): MenuInputConfigs { return this.configs; }
    public setConfigs(data: MenuInputConfigs | MenuInputConfigsJson): this {
        this.configs = data instanceof MenuInputConfigs ? data : new MenuInputConfigs(data);
        return this;
    }

    // labels

    public override getLabels(): MenuInputLabels { return this.labels; }

    public getPlaceholder(language?: Language): string | undefined {
        return this.labels.getPlaceholder()?.getValue(language);
    }
    public getValidate(): MenuInputConfigsJson["validate"] {
        return this.configs.getValidate();
    }
    public getCallback(): MenuInputConfigsJson["callback"] {
        return this.configs.getCallback();
    }

    // toJson

    public toJson(): MenuInputJson {
        return {
            ...super.toJson(),
            type: "input" as const,
            ...(this.value ? { value: this.value } : {}),
            ...(Object.keys(this.configs.toJson()).length > 0 ? { configs: this.configs.toJson() } : {}),
        };
    }

    // run

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
                if (res === true || res === undefined) return true;
                if (typeof res === "string" && res.length > 0) {
                    const asKey = Translations.getTranslation(res, language);
                    if (asKey !== res) return asKey;
                }
                return labels.getError()?.getValue(language) ?? true;
            }
            : undefined;

        const result = await prompt({
            message: this.getLabels().getQuestion()!.write({ color: this.getStyles().getIdle()?.getColor(), language }),
            input: {
                value: this.value,
                placeholder: resolvedPlaceholder,
                fastSubmit: this.configs.isFastSubmit() ?? false,
                inline: this.configs.isInline() ?? false,
                validate: translatedValidate,
            },
            ...(this.globalChoices.length > 0 ? { choices: this.globalChoices } : {}),
        });

        if (result.type === "input") {
            this.value = result.value;
            Utility.log(
                [new Date().toISOString(), `${this.getName()} - ${labels.getQuestion()?.getValue(language)}`, result.value].join("\n") + "\n"
            );
            return result.value;
        }

        // User selected from globalChoices sidebar
        return result.type === "choices" ? result.values : [result.value];
    }
}

export { type MenuInputJson, type MenuInputLabelsJson, type MenuInputConfigsJson, MenuInput, MenuInputLabels, MenuInputConfigs };