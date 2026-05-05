import { MenuChoiceConfigs, MenuChoiceConfigsJson } from "@/components/menus/choice/config";
import { MenuInputConfigs, MenuInputConfigsJson } from "@/components/menus/input/config";

type MenuFieldConfigsJson = {
    choice?: MenuChoiceConfigsJson;
    input?: MenuInputConfigsJson;
};

class MenuFieldConfigs {
    protected choiceConfigs?: MenuChoiceConfigs;
    protected inputConfigs?: MenuInputConfigs;

    /**
     * Creates a new MenuFieldConfigs with optional choice and input config nesting.
     * @param data Optional JSON object with choice and input config objects.
     */
    constructor(data?: MenuFieldConfigsJson) {
        if (data?.choice) {
            this.setChoiceConfigs(data.choice);
        }
        if (data?.input) {
            this.setInputConfigs(data.input);
        }
    }

    /** Returns the nested choice menu configs, or undefined if not configured. */
    public getChoiceConfigs(): MenuChoiceConfigs | undefined {
        return this.choiceConfigs;
    }

    /**
     * Sets the nested choice configs from an instance or a plain JSON object.
     * @param data MenuChoiceConfigs instance or compatible JSON.
     */
    public setChoiceConfigs(data: MenuChoiceConfigs | MenuChoiceConfigsJson): this {
        this.choiceConfigs = data instanceof MenuChoiceConfigs ? data : new MenuChoiceConfigs(data);
        return this;
    }

    /** Returns the nested input menu configs, or undefined if not configured. */
    public getInputConfigs(): MenuInputConfigs | undefined {
        return this.inputConfigs;
    }

    /**
     * Sets the nested input configs from an instance or a plain JSON object.
     * @param data MenuInputConfigs instance or compatible JSON.
     */
    public setInputConfigs(data: MenuInputConfigs | MenuInputConfigsJson): this {
        this.inputConfigs = data instanceof MenuInputConfigs ? data : new MenuInputConfigs(data);
        return this;
    }

    /** Serialises the configs to a plain JSON-compatible object. */
    public toJson(): MenuFieldConfigsJson {
        return {
            ...(this.choiceConfigs ? { choice: this.choiceConfigs.toJson() } : {}),
            ...(this.inputConfigs ? { input: this.inputConfigs.toJson() } : {}),
        };
    }
}

export { type MenuFieldConfigsJson, MenuFieldConfigs };
