import { ColorName } from "chalk";
import { Menu } from "../menu";
import { Action } from "../../actions";
import { Language, Translations } from "../../translations";
import { Utility } from "../../utility";
import { MenuFieldConfigSelected, MenuFieldConfigSelectedJson } from "./selected";
import { MenuFieldConfigIdle, MenuFieldConfigIdleJson } from "./idle";
import { MenuFieldConfigHover, MenuFieldConfigHoverJson } from "./hover";

type MenuFieldOptionJson = {
    value: string;
    label?: string;
    multi?: boolean;
    //color?: ColorName;
    idle?: MenuFieldConfigIdleJson;
    hover?: MenuFieldConfigHoverJson;
    selected?: MenuFieldConfigSelectedJson;
};

class MenuFieldOption {
    protected value: string | Menu | Action;
    protected label: string;
    protected multi: boolean;
    //protected color?: ColorName;
    protected idle?: MenuFieldConfigIdle;
    protected hover?: MenuFieldConfigHover;
    protected selected?: MenuFieldConfigSelected;

    constructor(
        value: string | Menu | Action,
        label?: string,
        multi?: boolean,
        //color?: ColorName,
        idle?: MenuFieldConfigIdleJson,
        hover?: MenuFieldConfigHoverJson,
        selected?: MenuFieldConfigSelectedJson
    ) {
        this.value = value;
        this.label = label ?? (typeof value === "string" ? value : value.getName());
        this.multi = multi ?? false;
        //this.color  = color;
        this.idle = idle
            ? new MenuFieldConfigIdle(idle.prefix, idle.color, idle.underline, idle.italic)
            : undefined;
        this.hover = hover
            ? new MenuFieldConfigHover(hover.prefix, hover.color, hover.underline, hover.italic)
            : undefined;
        this.selected = selected
            ? new MenuFieldConfigSelected(
                  selected.prefix,
                  selected.color,
                  selected.underline,
                  selected.italic
              )
            : undefined;
    }

    public getValue(): string {
        return typeof this.value === "string" ? this.value : this.value.getName();
    }
    public setValue(value: MenuFieldOption["value"]): this {
        this.value = value;
        return this;
    }

    public getLabel(): string {
        return this.label;
    }

    //public getColor(): MenuFieldOption['color'] | undefined { return this.color; }
    //public setColor(color: MenuFieldOption['color']): this { this.color = color; return this; }

    public isMulti(): boolean {
        return this.multi;
    }

    public getIndex(): number | undefined {
        return typeof this.value === "string" ? undefined : this.value.getIndex();
    }

    public getItem(): Exclude<MenuFieldOption["value"], string> | undefined {
        return typeof this.value === "string" ? undefined : this.value;
    }

    public getIdle(): MenuFieldConfigIdle | undefined {
        return this.idle;
    }
    public getIdlePrefix(): string | undefined {
        return this.idle?.getPrefix();
    }
    public setIdlePrefix(prefix?: string): this {
        if (!this.idle) {
            this.idle = new MenuFieldConfigIdle();
        }
        this.idle.setPrefix(prefix);

        return this;
    }
    public getIdleColor(): ColorName | undefined {
        return this.idle?.getColor();
    }
    public setIdleColor(color?: ColorName): this {
        if (!this.idle) {
            this.idle = new MenuFieldConfigIdle();
        }
        this.idle.setColor(color);

        return this;
    }

    public isIdleUnderline(): boolean | undefined {
        return this.idle?.isUnderline();
    }
    public setIdleUnderline(underline?: boolean): this {
        if (!this.idle) {
            this.idle = new MenuFieldConfigIdle();
        }
        this.idle.setUnderline(underline);

        return this;
    }
    public isIdleItalic(): boolean | undefined {
        return this.idle?.isItalic();
    }
    public setIdleItalic(italic?: boolean): this {
        if (!this.idle) {
            this.idle = new MenuFieldConfigIdle();
        }
        this.idle.setItalic(italic);

        return this;
    }

    public getHover(): MenuFieldConfigHover | undefined {
        return this.hover;
    }
    public getHoverPrefix(): string | undefined {
        return this.hover?.getPrefix();
    }
    public setHoverPrefix(prefix?: string): this {
        if (!this.hover) {
            this.hover = new MenuFieldConfigHover();
        }
        this.hover.setPrefix(prefix);

        return this;
    }
    public getHoverColor(): ColorName | undefined {
        return this.hover?.getColor();
    }
    public setHoverColor(color?: ColorName): this {
        if (!this.hover) {
            this.hover = new MenuFieldConfigHover();
        }
        this.hover.setColor(color);

        return this;
    }

    public isHoverUnderline(): boolean | undefined {
        return this.hover?.isUnderline();
    }
    public setHoverUnderline(underline?: boolean): this {
        if (!this.hover) {
            this.hover = new MenuFieldConfigHover();
        }
        this.hover.setUnderline(underline);

        return this;
    }
    public isHoverItalic(): boolean | undefined {
        return this.hover?.isItalic();
    }
    public setHoverItalic(italic?: boolean): this {
        if (!this.hover) {
            this.hover = new MenuFieldConfigHover();
        }
        this.hover.setItalic(italic);

        return this;
    }

    public getSelected(): MenuFieldConfigSelected | undefined {
        return this.selected;
    }
    public getSelectedPrefix(): string | undefined {
        return this.selected?.getPrefix();
    }
    public setSelectedPrefix(prefix?: string): this {
        if (!this.selected) {
            this.selected = new MenuFieldConfigSelected();
        }
        this.selected.setPrefix(prefix);

        return this;
    }
    public getSelectedColor(): ColorName | undefined {
        return this.selected?.getColor();
    }
    public setSelectedColor(color?: ColorName): this {
        if (!this.selected) {
            this.selected = new MenuFieldConfigSelected();
        }
        this.selected.setColor(color);

        return this;
    }

    public isSelectedUnderline(): boolean | undefined {
        return this.selected?.isUnderline();
    }
    public setSelectedUnderline(underline?: boolean): this {
        if (!this.selected) {
            this.selected = new MenuFieldConfigSelected();
        }
        this.selected.setUnderline(underline);

        return this;
    }
    public isSelectedItalic(): boolean | undefined {
        return this.selected?.isItalic();
    }
    public setSelectedItalic(italic?: boolean): this {
        if (!this.selected) {
            this.selected = new MenuFieldConfigSelected();
        }
        this.selected.setItalic(italic);

        return this;
    }

    public getTranslationLabel(
        isHover?: boolean,
        isSelected?: boolean,
        language?: Language
    ): string {
        let prefix: string = "";
        let color: ColorName | undefined = undefined;

        if (isHover) {
            if (this.getHover()?.getColor()) {
                color = this.getHover()?.getColor();
            }
            if ((this.getHover()?.getPrefix() ?? "").length > 0) {
                prefix = this.getHover()!.getPrefix()!;
            }
        }

        if (isSelected) {
            if (this.getSelected()?.getColor()) {
                color = this.getSelected()?.getColor();
            }
            if ((this.getSelected()?.getPrefix() ?? "").length > 0) {
                prefix = this.getSelected()!.getPrefix()!;
            }
        }

        if (prefix.length === 0) {
            if (this.getIdle()?.getPrefix()) {
                prefix = this.getIdle()?.getPrefix() ?? "";
            }
        }
        if (color === undefined) {
            if (this.getIdle()?.getColor()) {
                color = this.getIdle()?.getColor();
            }
        }

        const translation =
            this.getItem()?.getTitleLabel(language) ??
            Translations.getTranslation(this.getLabel() ?? this.getValue(), language);

        return Utility.write(`${prefix}${translation}`, color);
    }

    /**
     * Returns the plain translated label without any chalk styling.
     * Used by the prompt layer which handles styling via ChoiceStyle.
     */
    public getPlainTranslationLabel(language?: Language): string {
        return (
            this.getItem()?.getTitleLabel(language) ??
            Translations.getTranslation(this.getLabel() ?? this.getValue(), language)
        );
    }

    public toJson(): MenuFieldOptionJson {
        return {
            value: this.getValue(),
            label: this.getLabel(),
            multi: this.isMulti(),
        };
    }
}

export { type MenuFieldOptionJson, MenuFieldOption };
