import type { MenuInput } from "@/components/menus/input";

type MenuInputConfigsJson = {
    clear?: boolean;
    fastSubmit?: boolean;
    inline?: boolean;
    /** A string containing characters that should be blocked from input (e.g. " "). */
    forbidChars?: string;
    validate?: (value: string) => boolean | string;
    callback?: (data: { menu: MenuInput; value: string; language?: string; parent?: string }) => Promise<void>;
};

class MenuInputConfigs {
    protected clear: NonNullable<MenuInputConfigsJson["clear"]> = true;
    protected fastSubmit: NonNullable<MenuInputConfigsJson["fastSubmit"]> = false;
    protected inline: NonNullable<MenuInputConfigsJson["inline"]> = false;
    protected forbidChars?: MenuInputConfigsJson["forbidChars"];
    protected validate?: MenuInputConfigsJson["validate"];
    protected callback?: MenuInputConfigsJson["callback"];

    /**
     * Creates a new MenuInputConfigs with defaults.
     * @param data Optional JSON object with clear, fastSubmit, inline, validate, and callback.
     */
    constructor(data?: MenuInputConfigsJson) {
        if (data) {
            this.clear = data.clear ?? true;
            this.fastSubmit = data.fastSubmit ?? false;
            this.inline = data.inline ?? false;
            this.validate = data.validate;
            this.callback = data.callback;
            this.forbidChars = data.forbidChars;
        }
    }

    /** Returns true when the screen is cleared before rendering the input prompt. */
    public isClear(): MenuInputConfigsJson["clear"] {
        return this.clear;
    }

    /** Sets whether the screen is cleared before rendering the prompt. */
    public setClear(v: NonNullable<MenuInputConfigsJson["clear"]>): this {
        this.clear = v;
        return this;
    }

    /** Returns true when Enter is not required to submit (submits on single character). */
    public isFastSubmit(): MenuInputConfigsJson["fastSubmit"] {
        return this.fastSubmit;
    }

    /** Sets whether the prompt submits on the first character typed. */
    public setFastSubmit(v: NonNullable<MenuInputConfigsJson["fastSubmit"]>): this {
        this.fastSubmit = v;
        return this;
    }

    /** Returns true when the input is rendered inline (no full-screen takeover). */
    public isInline(): MenuInputConfigsJson["inline"] {
        return this.inline;
    }

    /** Sets whether the prompt is rendered inline. */
    public setInline(v: NonNullable<MenuInputConfigsJson["inline"]>): this {
        this.inline = v;
        return this;
    }

    /** Returns a string with characters that should be blocked while typing, or undefined. */
    public getForbidChars(): MenuInputConfigsJson["forbidChars"] {
        return this.forbidChars;
    }

    /** Sets characters that should be blocked while typing (e.g. a single space ' '). */
    public setForbidChars(v: MenuInputConfigsJson["forbidChars"]): this {
        this.forbidChars = v;
        return this;
    }

    /** Returns the validation function, or undefined if not configured. */
    public getValidate(): MenuInputConfigsJson["validate"] {
        return this.validate;
    }

    /**
     * Sets a custom validation function for the input value.
     * Return true to accept, a string to display as error, or false to show the generic error label.
     */
    public setValidate(v: MenuInputConfigsJson["validate"]): this {
        this.validate = v;
        return this;
    }

    /** Returns the submission callback, or undefined if not configured. */
    public getCallback(): MenuInputConfigsJson["callback"] {
        return this.callback;
    }

    /**
     * Sets the callback invoked after successful submission.
     * @param v Async callback receiving the menu and submitted value.
     */
    public setCallback(v: MenuInputConfigsJson["callback"]): this {
        this.callback = v;
        return this;
    }

    /** Serialises the config to a plain JSON-compatible object. */
    public toJson(): MenuInputConfigsJson {
        return {
            clear: this.clear,
            ...(this.fastSubmit ? { fastSubmit: this.fastSubmit } : {}),
            ...(this.inline ? { inline: this.inline } : {}),
            ...(this.forbidChars ? { forbidChars: this.forbidChars } : {}),
            ...(this.validate ? { validate: this.validate } : {}),
            ...(this.callback ? { callback: this.callback } : {}),
        };
    }
}

export { type MenuInputConfigsJson, MenuInputConfigs };
