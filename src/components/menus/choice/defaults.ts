import { MenuChoice } from ".";

type MenuChoiceConfigDefaultsJson = {
    values?: string[];
    callback?: (data: { menu: MenuChoice; values: string[]; language?: string; parent?: string }) => Promise<void>;
};

class MenuChoiceConfigDefaults {
    protected values: Exclude<MenuChoiceConfigDefaultsJson['values'], undefined>;
    protected callback?: MenuChoiceConfigDefaultsJson['callback'];

    constructor(
        values?: MenuChoiceConfigDefaultsJson['values'], 
        callback?: MenuChoiceConfigDefaultsJson['callback']
    ) {
        this.values = values ?? [];
        this.callback = callback;
    }

    public getValues(): MenuChoiceConfigDefaults['values'] { return this.values; }
    public setValues(values: MenuChoiceConfigDefaults['values']): this { this.values = values; return this; }

    public getCallback(): MenuChoiceConfigDefaults['callback'] | undefined { return this.callback; }
}

export {
    type MenuChoiceConfigDefaultsJson,
    MenuChoiceConfigDefaults
}