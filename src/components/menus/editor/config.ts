import type { MenuEditor } from "@/components/menus/editor";

type MenuEditorConfigsJson = {
    clear?: boolean;
    postfix?: string;
    waitForUserInput?: boolean;
    validate?: (value: string) => boolean | string | Promise<string | boolean>;
    callback?: (data: { menu: MenuEditor; value: string; language?: string; parent?: string }) => Promise<void>;
};

class MenuEditorConfigs {
    protected clear: NonNullable<MenuEditorConfigsJson["clear"]> = true;
    protected postfix: NonNullable<MenuEditorConfigsJson["postfix"]> = ".env";
    protected waitForUserInput: NonNullable<MenuEditorConfigsJson["waitForUserInput"]> = true;
    protected validate?: MenuEditorConfigsJson["validate"];
    protected callback?: MenuEditorConfigsJson["callback"];

    /**
     * Creates a new MenuEditorConfigs with defaults.
     * @param data Optional JSON with clear, postfix, waitForUserInput, validate, and callback.
     */
    constructor(data?: MenuEditorConfigsJson) {
        if (data) {
            this.clear = data.clear ?? true;
            this.postfix = data.postfix ?? ".env";
            this.waitForUserInput = data.waitForUserInput ?? true;
            this.validate = data.validate;
            this.callback = data.callback;
        }
    }

    /** Returns true when the screen is cleared before opening the editor. */
    public isClear(): MenuEditorConfigsJson["clear"] {
        return this.clear;
    }

    /** Sets whether the screen is cleared before opening the editor. */
    public setClear(v: NonNullable<MenuEditorConfigsJson["clear"]>): this {
        this.clear = v;
        return this;
    }

    /** Returns the file extension postfix used for the temp file (e.g. ".env"). */
    public getPostfix(): NonNullable<MenuEditorConfigsJson["postfix"]> {
        return this.postfix;
    }

    /** Sets the file extension postfix for the temp file. */
    public setPostfix(v: NonNullable<MenuEditorConfigsJson["postfix"]>): this {
        this.postfix = v;
        return this;
    }

    /** Returns true when the editor waits for user confirmation before opening. */
    public isWaitForUserInput(): NonNullable<MenuEditorConfigsJson["waitForUserInput"]> {
        return this.waitForUserInput;
    }

    /** Sets whether the prompt waits for a keypress before opening the editor. */
    public setWaitForUserInput(v: NonNullable<MenuEditorConfigsJson["waitForUserInput"]>): this {
        this.waitForUserInput = v;
        return this;
    }

    /** Returns the validation function, or undefined if not configured. */
    public getValidate(): MenuEditorConfigsJson["validate"] {
        return this.validate;
    }

    /** Sets a custom validation function for the editor content. */
    public setValidate(v: MenuEditorConfigsJson["validate"]): this {
        this.validate = v;
        return this;
    }

    /** Returns the submission callback, or undefined if not configured. */
    public getCallback(): MenuEditorConfigsJson["callback"] {
        return this.callback;
    }

    /** Sets the callback invoked after successful submission. */
    public setCallback(v: MenuEditorConfigsJson["callback"]): this {
        this.callback = v;
        return this;
    }

    /** Serialises the config to a plain JSON-compatible object. */
    public toJson(): MenuEditorConfigsJson {
        return {
            clear: this.clear,
            postfix: this.postfix,
            waitForUserInput: this.waitForUserInput,
            ...(this.validate ? { validate: this.validate } : {}),
            ...(this.callback ? { callback: this.callback } : {}),
        };
    }
}

export { type MenuEditorConfigsJson, MenuEditorConfigs };
