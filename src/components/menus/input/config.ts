import { MenuField } from "..";

type MenuInputConfigsJson = {
    placeholder?: string;
    clear?: boolean;
    fastSubmit?: boolean;
    inline?: boolean;
    validate?: (value: string) => boolean | string;
    callback?: (data: {
        menu: MenuField;
        value: string;
        language?: string;
        parent?: string;
    }) => Promise<void>;
};

class MenuInputConfigs {
    protected value: string = "";
    protected placeholder: NonNullable<MenuInputConfigsJson["placeholder"]> = "";
    protected clear: NonNullable<MenuInputConfigsJson["clear"]> = true;
    protected fastSubmit: NonNullable<MenuInputConfigsJson["fastSubmit"]> = false;
    protected inline: NonNullable<MenuInputConfigsJson["inline"]> = false;
    protected validate?: MenuInputConfigsJson["validate"];
    protected callback?: MenuInputConfigsJson["callback"];

    constructor(data?: MenuInputConfigsJson) {
        if (data) {
            this.placeholder = data.placeholder ?? "";
            this.clear = data.clear ?? true;
            this.fastSubmit = data.fastSubmit ?? false;
            this.inline = data.inline ?? false;
            this.validate = data.validate;
            this.callback = data.callback;
        }
    }

    public getValue(): string { return this.value; }
    public setValue(v: string): this { this.value = v; return this; }

    public getPlaceholder(): MenuInputConfigsJson["placeholder"] { return this.placeholder; }
    public setPlaceholder(v: NonNullable<MenuInputConfigsJson["placeholder"]>): this { this.placeholder = v; return this; }

    public isClear(): MenuInputConfigsJson["clear"] { return this.clear; }
    public setClear(v: NonNullable<MenuInputConfigsJson["clear"]>): this { this.clear = v; return this; }

    public isFastSubmit(): MenuInputConfigsJson["fastSubmit"] { return this.fastSubmit; }
    public setFastSubmit(v: NonNullable<MenuInputConfigsJson["fastSubmit"]>): this { this.fastSubmit = v; return this; }

    public isInline(): MenuInputConfigsJson["inline"] { return this.inline; }
    public setInline(v: NonNullable<MenuInputConfigsJson["inline"]>): this { this.inline = v; return this; }

    public getValidate(): MenuInputConfigsJson["validate"] { return this.validate; }
    public setValidate(v: MenuInputConfigsJson["validate"]): this { this.validate = v; return this; }

    public getCallback(): MenuInputConfigsJson["callback"] { return this.callback; }
    public setCallback(v: MenuInputConfigsJson["callback"]): this { this.callback = v; return this; }

    public toJson(): MenuInputConfigsJson {
        return {
            ...(this.placeholder ? { placeholder: this.placeholder } : {}),
            clear: this.clear,
            ...(this.fastSubmit ? { fastSubmit: this.fastSubmit } : {}),
            ...(this.inline ? { inline: this.inline } : {}),
            ...(this.validate ? { validate: this.validate } : {}),
            ...(this.callback ? { callback: this.callback } : {}),
        };
    }
}

export {
    type MenuInputConfigsJson,
    MenuInputConfigs
};