import { MenuField } from ".";

type MenuFieldConfigDefaultsJson = {
    values?: string[];
    callback?: (data: { menu: MenuField; values: string[]; language?: string; parent?: string }) => Promise<void>;
};

class MenuFieldConfigDefaults {
    protected values: Exclude<MenuFieldConfigDefaultsJson["values"], undefined>;
    protected callback?: MenuFieldConfigDefaultsJson["callback"];

    constructor(values?: MenuFieldConfigDefaultsJson["values"], callback?: MenuFieldConfigDefaultsJson["callback"]) {
        this.values = values ?? [];
        this.callback = callback;
    }

    public getValues(): MenuFieldConfigDefaults["values"] {
        return this.values;
    }
    public setValues(values: MenuFieldConfigDefaults["values"]): this {
        this.values = values;
        return this;
    }

    public getCallback(): MenuFieldConfigDefaults["callback"] | undefined {
        return this.callback;
    }
}

export { type MenuFieldConfigDefaultsJson, MenuFieldConfigDefaults };
