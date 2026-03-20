import { MenuJson } from "../menu";
import { MenuField } from "../field";
import { MenuInputConfigs, MenuInputConfigsJson } from "./config";

type MenuInputJson = Omit<MenuJson, "type"> & {
    type: "input";
    value?: string;
    configs?: MenuInputConfigsJson;
};

class MenuInput extends MenuField {
    constructor(data: MenuInputJson) {
        super({
            ...data,
            type: "field",
            configs: data.configs ? { input: data.configs } : undefined,
        });

        if (data.value !== undefined) {
            this.configs.getInputConfigs()?.setValue(data.value);
        }
    }

    /** Returns the current input value. */
    public getValue(): string { return this.getInputValue(); }

    public getPlaceholder(): string { return this.configs.getInputConfigs()?.getPlaceholder() ?? ""; }
    public getValidate(): MenuInputConfigsJson["validate"] { return this.configs.getInputConfigs()?.getValidate(); }
    public getCallback(): MenuInputConfigsJson["callback"] { return this.configs.getInputConfigs()?.getCallback(); }
}

export {
    type MenuInputJson,
    type MenuInputConfigsJson,
    MenuInput,
    MenuInputConfigs,
};