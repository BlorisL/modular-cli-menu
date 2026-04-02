import { MenuJson } from "../menu";
import { MenuField } from "../field";
import { MenuInputLabels, MenuInputLabelsJson } from "./labels";
import { MenuInputConfigs, MenuInputConfigsJson } from "./config";

type MenuInputJson = Omit<MenuJson, "type" | "labels"> & {
    type: "input";
    labels?: MenuInputLabelsJson;
    value?: string;
    configs?: MenuInputConfigsJson;
};

class MenuInput extends MenuField {
    protected labels!: MenuInputLabels;

    constructor(data: MenuInputJson) {
        super({
            ...data,
            type: "field",
            configs: data.configs ? { input: data.configs } : undefined,
        });

        const il = data.labels;
        const plugin = this.getPlugin() ?? "default";
        const name = this.getName();
        this.labels = new MenuInputLabels({
            question: this.labels.getQuestion()?.getName(),
            title: this.labels.getTitle()?.getName(),
            success: this.labels.getSuccess()?.getName(),
            error: this.labels.getError()?.getName(),
            placeholder: il?.placeholder ?? `${plugin}.${name}.placeholder`,
        });

        if (data.value !== undefined) {
            this.configs.getInputConfigs()?.setValue(data.value);
        }
    }

    /** Returns the current input value. */
    public getValue(): string {
        return this.getConfigs().getInputConfigs()?.getValue() ?? "";
    }

    public override getLabels(): MenuInputLabels {
        return this.labels;
    }

    public getPlaceholder(): string {
        return this.getLabels().getPlaceholder()?.getValue() ?? "";
    }
    public getValidate(): MenuInputConfigsJson["validate"] {
        return this.configs.getInputConfigs()?.getValidate();
    }
    public getCallback(): MenuInputConfigsJson["callback"] {
        return this.configs.getInputConfigs()?.getCallback();
    }
}

export { type MenuInputJson, type MenuInputLabelsJson, type MenuInputConfigsJson, MenuInput, MenuInputLabels, MenuInputConfigs };
