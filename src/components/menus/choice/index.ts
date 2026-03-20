import { MenuJson } from "../menu";
import { MenuField, MenuFieldJson, MenuFieldJsonValue, MenuFieldOptionJson } from "../field";
import { MenuChoiceConfigs, MenuChoiceConfigsJson } from "./config";

type MenuChoiceJson = Omit<MenuJson, "type"> & {
    type: "choice";
    values?: Array<MenuFieldJsonValue> | ((data: { menu: MenuField }) => Array<MenuFieldJsonValue>);
    configs?: MenuChoiceConfigsJson;
};

class MenuChoice extends MenuField {
    constructor(data: MenuChoiceJson) {
        super({
            ...data,
            type: "field",
            configs: data.configs ? { choice: data.configs } : undefined,
        });
    }

    public toJson(): MenuFieldJson {
        const base = super.toJson();
        const choiceCfg = this.configs.getChoiceConfigs();

        const result: MenuChoiceJson = {
            name: base.name,
            type: "choice",
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
            ...(base.values && base.values.length > 0 ? { values: base.values as MenuFieldOptionJson[] } : {}),
            ...(choiceCfg ? { configs: choiceCfg.toJson() } : {}),
        };

        return result as unknown as MenuFieldJson;
    }
}

export {
    type MenuChoiceJson,
    type MenuChoiceConfigsJson,
    MenuChoice,
    MenuChoiceConfigs,
};