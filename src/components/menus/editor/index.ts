import editor from "@inquirer/editor";
import { Menu, MenuJson } from "@/components/menus/menu";
import { Language } from "@/components/translations";
import { Utility } from "@/components/utility";
import { MenuLabels, MenuLabelsJson } from "@/components/menus/labels";
import { MenuEditorConfigs, MenuEditorConfigsJson } from "@/components/menus/editor/config";

type MenuEditorDefaultFn = (data: { menu: MenuEditor }) => string;

type MenuEditorJson = Omit<MenuJson, "type" | "labels"> & {
    type: "editor";
    labels?: MenuLabelsJson;
    /** Contenuto pre-popolato nell'editor. Può essere una stringa statica o una funzione valutata ad ogni apertura. */
    default?: string | MenuEditorDefaultFn;
    configs?: MenuEditorConfigsJson;
};

class MenuEditor extends Menu {
    protected type: MenuJson["type"] = "editor";
    protected labels!: MenuLabels;
    protected default: string | MenuEditorDefaultFn = "";
    protected value: string = "";
    protected configs: MenuEditorConfigs = new MenuEditorConfigs();

    /**
     * Creates a new editor menu that opens the system $EDITOR with pre-populated content.
     * @param data Menu JSON including name, type, optional default content (static or dynamic), and editor-specific configs.
     */
    constructor(data: MenuEditorJson) {
        super(data);
        this.configs = data.configs ? new MenuEditorConfigs(data.configs) : new MenuEditorConfigs();
        if (data.default !== undefined) {
            this.default = data.default;
        }
    }

    // value API

    /** Returns the last submitted editor content, or empty string if never run. */
    public getValue(): string {
        return this.value;
    }

    /**
     * Resolves the default content: evaluates the function if dynamic, returns the string if static.
     */
    public getDefault(): string {
        const result = typeof this.default === "function"
            ? this.default({ menu: this })
            : this.default
        ;
        return result;
    }

    /**
     * Sets the default content pre-populated in the editor.
     * Accepts a static string or a function evaluated each time the editor opens.
     * @param v Static string or dynamic function.
     */
    public setDefault(v: string | MenuEditorDefaultFn): this {
        this.default = v;
        return this;
    }

    // configs API

    /** Returns the configs object for this editor menu. */
    public getConfigs(): MenuEditorConfigs {
        return this.configs;
    }

    /**
     * Sets the configs from an instance or a plain JSON object.
     * @param data MenuEditorConfigs instance or compatible JSON.
     */
    public setConfigs(data: MenuEditorConfigs): this;
    public setConfigs(data: MenuEditorConfigsJson): this;
    public setConfigs(data: MenuEditorConfigs | MenuEditorConfigsJson): this {
        this.configs = data instanceof MenuEditorConfigs ? data : new MenuEditorConfigs(data);
        return this;
    }

    // labels

    /** Returns the labels container for this editor menu. */
    public override getLabels(): MenuLabels {
        return this.labels;
    }

    // toJson

    /** Serialises this editor menu to a plain JSON-compatible object. */
    public toJson(): MenuEditorJson {
        const defaultValue = this.getDefault();
        return {
            ...super.toJson(),
            type: "editor" as const,
            ...(defaultValue ? { default: defaultValue } : {}),
            ...(Object.keys(this.configs.toJson()).length > 0 ? { configs: this.configs.toJson() } : {}),
        };
    }

    // run

    /**
     * Opens the system $EDITOR with the default content pre-populated.
     * Returns the edited content string.
     * @param language Optional language override for label translation.
     */
    public async run(language?: Language): Promise<string> {
        if (this.configs.isClear() ?? true) {
            console.clear();
        }

        const message = this.getLabels().getQuestion()!.write({
            color: this.getStyles().getIdle()?.getColor(),
            language,
        });

        const result = await editor({
            message,
            default: this.getDefault(),
            postfix: this.configs.getPostfix(),
            waitForUserInput: this.configs.isWaitForUserInput(),
            validate: this.configs.getValidate(),
        });

        this.value = result;

        Utility.log(
            [
                new Date().toISOString(),
                `${this.getName()} - ${this.getLabels().getQuestion()?.getValue(language)}`,
                result,
            ].join("\n") + "\n"
        );

        return result;
    }
}

export {
    type MenuEditorJson,
    type MenuEditorDefaultFn,
    type MenuEditorConfigsJson,
    MenuEditor,
    MenuEditorConfigs,
};
