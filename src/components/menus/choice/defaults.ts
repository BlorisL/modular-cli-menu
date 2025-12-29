type MenuChoiceConfigDefaultsJson = {
    values?: string[];
    callback?: (selected: string[]) => Promise<void>;
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
    
    public getCallback(): Promise<void> | undefined { return this.callback?.(this.getValues()); }
}

export {
    type MenuChoiceConfigDefaultsJson,
    MenuChoiceConfigDefaults
}