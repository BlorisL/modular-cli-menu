import type { MenuChoice } from "@/components/menus/choice";

type MenuChoiceConfigsJson = {
    selectable?: boolean;
    defaultValues?: string[];
    callback?: (data: { menu: MenuChoice; values: string[]; language?: string; parent?: string }) => Promise<void>;
};

class MenuChoiceConfigs {
    protected selectable: boolean = false;
    protected defaultValues: string[] = [];
    protected callback?: MenuChoiceConfigsJson["callback"];

    constructor(data?: MenuChoiceConfigsJson) {
        if (data?.selectable !== undefined) {
            this.selectable = data.selectable;
        }
        if (data?.defaultValues) {
            this.defaultValues = data.defaultValues;
        }
        if (data?.callback) {
            this.callback = data.callback;
        }
    }

    public isSelectable(): boolean {
        return this.selectable;
    }

    public setSelectable(v: boolean): this {
        this.selectable = v;
        return this;
    }

    public getDefaultValues(): string[] {
        return this.defaultValues;
    }

    public setDefaultValues(v: string[]): this {
        this.defaultValues = v;
        return this;
    }

    public getCallback(): MenuChoiceConfigsJson["callback"] {
        return this.callback;
    }

    public setCallback(v: MenuChoiceConfigsJson["callback"]): this {
        this.callback = v;
        return this;
    }

    public toJson(): MenuChoiceConfigsJson {
        return {
            ...(this.selectable ? { selectable: true } : {}),
            ...(this.defaultValues.length > 0 ? { defaultValues: this.defaultValues } : {}),
            ...(this.callback ? { callback: this.callback } : {}),
        };
    }
}

export { type MenuChoiceConfigsJson, MenuChoiceConfigs };
