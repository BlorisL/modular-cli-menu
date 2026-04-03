import { Menu } from "@/components/menus/menu";
import { Action } from "@/components/actions";
import { MenuStyles, MenuStylesJson } from "@/components/menus/styles";
import { MenuFieldOptionLabels, MenuFieldOptionLabelsJson } from "./labels";

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

    constructor(
        value: string | Menu | Action,
        multi?: boolean,
        labels?: MenuFieldOptionLabelsJson,
        styles?: MenuStylesJson,
    ) {
        this.value = value;
        this.labels = new MenuFieldOptionLabels(
            labels ?? { title: typeof value === "string" ? value : value.getName() }
        );
        this.multi = multi ?? false;
        this.styles = new MenuStyles(styles);
    }

    public getValue(): string {
        return typeof this.value === "string" ? this.value : this.value.getName();
    }
    public setValue(value: MenuFieldOption["value"]): this {
        this.value = value;
        return this;
    }

    public isMulti(): boolean {
        return this.multi;
    }

    public getIndex(): number | undefined {
        return typeof this.value === "string" ? undefined : this.value.getIndex();
    }

    public getItem(): Exclude<MenuFieldOption["value"], string> | undefined {
        return typeof this.value === "string" ? undefined : this.value;
    }

    public getLabels(): MenuFieldOptionLabels {
        return this.labels;
    }
    public setLabels(labels: MenuFieldOptionLabels | MenuFieldOptionLabelsJson): this {
        this.labels = labels instanceof MenuFieldOptionLabels ? labels : new MenuFieldOptionLabels(labels);
        return this;
    }

    public getStyles(): MenuStyles {
        return this.styles;
    }
    public setStyles(styles: MenuStyles | MenuStylesJson): this {
        this.styles = styles instanceof MenuStyles ? styles : new MenuStyles(styles);
        return this;
    }

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

export { 
    type MenuFieldOptionJson, 
    type MenuFieldOptionLabelsJson, 
    MenuFieldOption, 
    MenuFieldOptionLabels, 
};
