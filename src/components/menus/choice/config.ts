import { MenuField } from "..";

type MenuChoiceConfigsJson = {
    selectable?: boolean;
    defaultValues?: string[];
    callback?: (data: {
        menu: MenuField;
        values: string[];
        language?: string;
        parent?: string;
    }) => Promise<void>;
};

class MenuChoiceConfigs {
    protected selectable: boolean = false;
    protected defaultValues: string[] = [];
    protected selectedValues: string[] = [];
    protected callback?: MenuChoiceConfigsJson["callback"];

    constructor(data?: MenuChoiceConfigsJson) {
        if (data?.selectable !== undefined) this.selectable = data.selectable;
        if (data?.defaultValues) {
            this.defaultValues = data.defaultValues;
            this.selectedValues = [...data.defaultValues];
        }
        if (data?.callback) this.callback = data.callback;
    }

    public isSelectable(): boolean { return this.selectable; }
    public setSelectable(v: boolean): this { this.selectable = v; return this; }

    public getDefaultValues(): string[] { return this.defaultValues; }
    public setDefaultValues(v: string[]): this { this.defaultValues = v; return this; }

    public getSelectedValues(): string[] { return this.selectedValues; }
    public setSelectedValues(v: string[]): this { this.selectedValues = v; return this; }
    public addSelectedValue(v: string): this {
        if (!this.selectedValues.includes(v)) this.selectedValues.push(v);
        return this;
    }
    public delSelectedValue(v: string): this {
        this.selectedValues = this.selectedValues.filter((s) => s !== v);
        return this;
    }
    public isSelectedValue(v: string): boolean { return this.selectedValues.includes(v); }

    public getCallback(): MenuChoiceConfigsJson["callback"] { return this.callback; }
    public setCallback(v: MenuChoiceConfigsJson["callback"]): this { this.callback = v; return this; }

    public toJson(): MenuChoiceConfigsJson {
        return {
            ...(this.selectable ? { selectable: true } : {}),
            ...(this.defaultValues.length > 0 ? { defaultValues: this.defaultValues } : {}),
            ...(this.callback ? { callback: this.callback } : {}),
        };
    }
}

export { type MenuChoiceConfigsJson, MenuChoiceConfigs };