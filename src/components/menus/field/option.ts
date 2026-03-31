import { Menu } from "../menu";
import { Action } from "../../actions";
import { Language, Translations } from "../../translations";
import { Label } from "../../translations";
import { Utility } from "../../utility";
import { MenuStyles, MenuStylesJson } from "../styles";

// 

type MenuFieldOptionLabelsJson = {
    title?: string;
};

class MenuFieldOptionLabels {
    protected title?: Label;

    constructor(data?: MenuFieldOptionLabelsJson) {
        this.title = data?.title ? new Label(data.title) : undefined;
    }

    public getTitle(): MenuFieldOptionLabels["title"] {
        return this.title;
    }
    public setTitle(
        title: NonNullable<MenuFieldOptionLabels["title"] | MenuFieldOptionLabelsJson["title"]>,
        callback?: Label["callback"],
    ): this {
        this.title = title instanceof Label
            ? new Label(title.getName(), callback ?? title.getCallback())
            : new Label(title);
        return this;
    }

    public toJson(): MenuFieldOptionLabelsJson {
        return {
            ...(this.title ? { title: this.title.getValue() } : {}),
        };
    }
}


type MenuFieldOptionJson = {
    value: string;
    multi?: boolean;
    labels?: MenuFieldOptionLabelsJson;
    styles?: MenuStylesJson;
};

// ── Class

class MenuFieldOption {
    protected value: string | Menu | Action;
    protected labels: MenuFieldOptionLabels;
    protected multi: boolean;
    protected styles: MenuStyles;

    constructor(
        value: string | Menu | Action,
        label?: string,
        multi?: boolean,
        idle?: MenuStylesJson["idle"],
        hover?: MenuStylesJson["hover"],
        selected?: MenuStylesJson["selected"]
    ) {
        this.value = value;
        this.labels = new MenuFieldOptionLabels({
            title: label ?? (typeof value === "string" ? value : value.getName()),
        });
        this.multi = multi ?? false;
        this.styles = new MenuStyles({
            ...(idle ? { idle } : {}),
            ...(hover ? { hover } : {}),
            ...(selected ? { selected } : {}),
        });
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

    public getTranslationLabel(isHover?: boolean, isSelected?: boolean, language?: Language): string {
        let prefix: string = "";
        let color = this.styles.getIdle()?.getColor();

        if (isHover) {
            const h = this.styles.getHover();
            if (h?.getColor()) color = h.getColor();
            if ((h?.getPrefix() ?? "").length > 0) prefix = h!.getPrefix()!;
        }

        if (isSelected) {
            const s = this.styles.getSelected();
            if (s?.getColor()) color = s.getColor();
            if ((s?.getPrefix() ?? "").length > 0) prefix = s!.getPrefix()!;
        }

        if (prefix.length === 0) {
            prefix = this.styles.getIdle()?.getPrefix() ?? "";
        }

        const translation =
            this.getItem()?.getLabels().getTitle()?.getValue(language) ??
            this.labels.getTitle()?.getValue(language) ??
            Translations.getTranslation(this.getValue(), language);

        return Utility.write(`${prefix}${translation}`, color);
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

export { type MenuFieldOptionLabelsJson, MenuFieldOptionLabels, type MenuFieldOptionJson, MenuFieldOption };
