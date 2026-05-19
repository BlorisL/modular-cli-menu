import type { MenuChoice } from "@/components/menus/choice";

type MenuChoiceConfigsJson = {
    selectable?: boolean;
    defaultValues?: string[];
    pageSize?: number;
    callback?: (data: { menu: MenuChoice; values: string[]; language?: string; parent?: string }) => Promise<void>;
};

class MenuChoiceConfigs {
    protected selectable: NonNullable<MenuChoiceConfigsJson["selectable"]> = false;
    protected defaultValues: NonNullable<MenuChoiceConfigsJson["defaultValues"]> = [];
    protected pageSize?: NonNullable<MenuChoiceConfigsJson["pageSize"]>;
    protected callback?: MenuChoiceConfigsJson["callback"];

    /**
     * Creates a new MenuChoiceConfigs with defaults.
     * @param data Optional JSON object with selectable, defaultValues, and callback.
     */
    constructor(data?: MenuChoiceConfigsJson) {
        if (data?.selectable !== undefined) {
            this.selectable = data.selectable;
        }
        if (data?.defaultValues) {
            this.defaultValues = data.defaultValues;
        }
        if (data?.pageSize !== undefined) {
            this.pageSize = data.pageSize;
        }
        if (data?.callback) {
            this.callback = data.callback;
        }
    }

    /** Returns true when the choice menu allows multi-selection. */
    public isSelectable(): boolean {
        return this.selectable;
    }

    /**
     * Sets whether the choice menu allows multi-selection.
     * @param v True to enable multi-selection.
     */
    public setSelectable(v: boolean): this {
        this.selectable = v;
        return this;
    }

    /** Returns the list of pre-selected option names. */
    public getDefaultValues(): string[] {
        return this.defaultValues;
    }

    /**
     * Replaces the pre-selected option names.
     * @param v Array of option names to pre-select.
     */
    public setDefaultValues(v: string[]): this {
        this.defaultValues = v;
        return this;
    }

    /** Returns the page size for scrollable choice lists, or undefined for no limit. */
    public getPageSize(): MenuChoiceConfigs["pageSize"] {
        return this.pageSize;
    }

    /**
     * Sets the maximum number of visible rows before scrolling kicks in.
     * @param v Number of rows, or undefined to disable paging.
     */
    public setPageSize(v: MenuChoiceConfigs["pageSize"]): this {
        this.pageSize = v;
        return this;
    }

    /** Returns the submission callback, or undefined if not set. */
    public getCallback(): MenuChoiceConfigsJson["callback"] {
        return this.callback;
    }

    /**
     * Sets the callback invoked when the user confirms a selection.
     * @param v Async callback receiving the menu and selected values.
     */
    public setCallback(v: MenuChoiceConfigsJson["callback"]): this {
        this.callback = v;
        return this;
    }

    /** Serialises the config to a plain JSON-compatible object. */
    public toJson(): MenuChoiceConfigsJson {
        return {
            ...(this.selectable ? { selectable: true } : {}),
            ...(this.defaultValues.length > 0 ? { defaultValues: this.defaultValues } : {}),
            ...(this.pageSize !== undefined ? { pageSize: this.pageSize } : {}),
            ...(this.callback ? { callback: this.callback } : {}),
        };
    }
}

export { type MenuChoiceConfigsJson, MenuChoiceConfigs };
