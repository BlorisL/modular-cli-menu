import { Menu } from "@/components/menus/menu";
import { Action } from "@/components/actions";
import { MenuStyles, MenuStylesJson } from "@/components/menus/styles";
import { MenuFieldOptionLabels, MenuFieldOptionLabelsJson } from "@/components/menus/field/option/labels";

type MenuFieldOptionJson = {
    value: string;
    multi?: boolean;
    labels?: MenuFieldOptionLabelsJson;
    styles?: MenuStylesJson;
};

class MenuFieldOption {
    protected value: string | Menu | Action;
    protected labels: MenuFieldOptionLabels;
    protected multi: boolean;
    protected styles: MenuStyles;

    /**
     * Creates a new menu field option from a value (string, Menu, or Action).
     * @param value String label, Menu instance, or Action instance.
     * @param multi Optional flag for multi-line display.
     * @param labels Optional label customizations.
     * @param styles Optional style customizations.
     */
    constructor(
        value: string | Menu | Action,
        multi?: boolean,
        labels?: MenuFieldOptionLabelsJson,
        styles?: MenuStylesJson
    ) {
        this.value = value;
        this.labels = new MenuFieldOptionLabels(
            labels ?? { title: typeof value === "string" ? value : value.getName() }
        );
        this.multi = multi ?? false;
        this.styles = new MenuStyles(styles);
    }

    /** Returns the display value: string label or the referenced Menu/Action name. */
    public getValue(): string {
        return typeof this.value === "string" ? this.value : this.value.getName();
    }

    /**
     * Replaces the underlying value.
     * @param value String label, Menu instance, or Action instance.
     */
    public setValue(value: MenuFieldOption["value"]): this {
        this.value = value;
        return this;
    }

    /** Returns true when this option is flagged for multi-line rendering. */
    public isMulti(): boolean {
        return this.multi;
    }

    /** Returns the display index if the value is a Menu or Action, or undefined for string values. */
    public getIndex(): number | undefined {
        return typeof this.value === "string" ? undefined : this.value.getIndex();
    }

    /** Returns the underlying Menu or Action instance, or undefined if this is a string value. */
    public getItem(): Exclude<MenuFieldOption["value"], string> | undefined {
        return typeof this.value === "string" ? undefined : this.value;
    }

    /** Returns the labels container for this option. */
    public getLabels(): MenuFieldOptionLabels {
        return this.labels;
    }

    /**
     * Sets the labels from an instance or a plain JSON object.
     * @param labels MenuFieldOptionLabels instance or compatible JSON.
     */
    public setLabels(labels: MenuFieldOptionLabels | MenuFieldOptionLabelsJson): this {
        this.labels = labels instanceof MenuFieldOptionLabels ? labels : new MenuFieldOptionLabels(labels);
        return this;
    }

    /** Returns the styles container for this option. */
    public getStyles(): MenuStyles {
        return this.styles;
    }

    /**
     * Sets the styles from an instance or a plain JSON object.
     * @param styles MenuStyles instance or compatible JSON.
     */
    public setStyles(styles: MenuStyles | MenuStylesJson): this {
        this.styles = styles instanceof MenuStyles ? styles : new MenuStyles(styles);
        return this;
    }

    /** Serialises this option to a plain JSON-compatible object. */
    public toJson(): MenuFieldOptionJson {
        const labelsJson = this.labels.toJson();
        const stylesJson = this.styles.toJson();
        return {
            value: this.getValue(),
            multi: this.isMulti(),
            ...(labelsJson.title ? { labels: labelsJson } : {}),
            ...(stylesJson.idle || stylesJson.hover || stylesJson.selected ? { styles: stylesJson } : {}),
        };
    }
}

export { type MenuFieldOptionJson, type MenuFieldOptionLabelsJson, MenuFieldOption, MenuFieldOptionLabels };
