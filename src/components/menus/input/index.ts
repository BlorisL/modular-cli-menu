import { MenuJson } from "../menu";
import { MenuField, MenuFieldOption } from "../field";
import { MenuInputConfigs, MenuInputConfigsJson } from "./config";

type MenuInputJson = Omit<MenuJson, "type"> & {
    type: "input";
    value?: string;
} & MenuInputConfigsJson;

class MenuInput extends MenuField {
    constructor(data: MenuInputJson) {
        super({
            ...data,
            type: "field",
            values: data.value !== undefined && data.value !== ""
                ? [{ value: "", label: data.value }]
                : undefined,
            configs: {
                input: {
                    placeholder: data.placeholder,
                    clear: data.clear,
                    fastSubmit: data.fastSubmit,
                    inline: data.inline,
                    validate: data.validate,
                    callback: data.callback,
                },
            },
        });
    }

    /**
     * Returns the current input value.
     * MenuInput always stores its value as values[""] — this override
     * ignores any key and always returns that single element.
     */
    public getValue(): MenuFieldOption | undefined {
        return this.resolveValues()[""];
    }

    public getPlaceholder(): string { return this.configs.getInputConfigs()?.getPlaceholder() ?? ""; }
    public getValidate(): MenuInputConfigsJson["validate"] { return this.configs.getInputConfigs()?.getValidate(); }
    public getCallback(): MenuInputConfigsJson["callback"] { return this.configs.getInputConfigs()?.getCallback(); }

    public toJson(): MenuInputJson {
        const base = super.toJson();
        const cfgJson = this.configs.getInputConfigs()?.toJson() ?? {};

        return {
            name: base.name,
            type: "input",
            plugin: base.plugin,
            index: base.index,
            idle: base.idle,
            hover: base.hover,
            selected: base.selected,
            parents: base.parents,
            question: base.question,
            title: base.title,
            success: base.success,
            error: base.error,
            value: this.getValue()?.getLabel() || undefined,
            ...cfgJson,
        };
    }
}

export {
    type MenuInputJson,
    type MenuInputConfigsJson,
    MenuInput,
    MenuInputConfigs,
};