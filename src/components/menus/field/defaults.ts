import { MenuField } from "@/components/menus/field";

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

    /** Returns the list of default values. */
    public getValues(): MenuFieldConfigDefaults["values"] {
        return this.values;
    }

    /**
     * Replaces the list of default values.
     * @param values Array of default value strings.
     */
    public setValues(values: MenuFieldConfigDefaults["values"]): this {
        this.values = values;
        return this;
    }

    /** Returns the callback invoked with the resolved defaults, or undefined if not set. */
    public getCallback(): MenuFieldConfigDefaults["callback"] | undefined {
        return this.callback;
    }
}

export { type MenuFieldConfigDefaultsJson, MenuFieldConfigDefaults };
