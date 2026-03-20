import { MenuJson } from "../menu";
import { MenuField, MenuFieldJsonValue } from "../field";
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
}

export {
    type MenuChoiceJson,
    type MenuChoiceConfigsJson,
    MenuChoice,
    MenuChoiceConfigs,
};