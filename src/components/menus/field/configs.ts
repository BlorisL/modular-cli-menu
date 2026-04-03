import { MenuChoiceConfigs, MenuChoiceConfigsJson } from "@/components/menus/choice/config";
import { MenuInputConfigs, MenuInputConfigsJson } from "@/components/menus/input/config";

type MenuFieldConfigsJson = {
    choice?: MenuChoiceConfigsJson;
    input?: MenuInputConfigsJson;
};

class MenuFieldConfigs {
    protected choiceConfigs?: MenuChoiceConfigs;
    protected inputConfigs?: MenuInputConfigs;

    constructor(data?: MenuFieldConfigsJson) {
        if (data?.choice) {
            this.setChoiceConfigs(data.choice);
        }
        if (data?.input) {
            this.setInputConfigs(data.input);
        }
    }

    public getChoiceConfigs(): MenuChoiceConfigs | undefined {
        return this.choiceConfigs;
    }
    public setChoiceConfigs(data: MenuChoiceConfigs | MenuChoiceConfigsJson): this {
        this.choiceConfigs = data instanceof MenuChoiceConfigs ? data : new MenuChoiceConfigs(data);
        return this;
    }

    public getInputConfigs(): MenuInputConfigs | undefined {
        return this.inputConfigs;
    }
    public setInputConfigs(data: MenuInputConfigs | MenuInputConfigsJson): this {
        this.inputConfigs = data instanceof MenuInputConfigs ? data : new MenuInputConfigs(data);
        return this;
    }

    public toJson(): MenuFieldConfigsJson {
        return {
            ...(this.choiceConfigs ? { choice: this.choiceConfigs.toJson() } : {}),
            ...(this.inputConfigs ? { input: this.inputConfigs.toJson() } : {}),
        };
    }
}

export { type MenuFieldConfigsJson, MenuFieldConfigs };
