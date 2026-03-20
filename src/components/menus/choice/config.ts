import { Utility } from "@/components/utility";
import { MenuFieldConfigDefaults, MenuFieldConfigDefaultsJson } from "../field/defaults";
import { MenuFieldConfigIdle, MenuFieldConfigIdleJson } from "../field/idle";
import { MenuFieldConfigHover, MenuFieldConfigHoverJson } from "../field/hover";
import { MenuFieldConfigSelected, MenuFieldConfigSelectedJson } from "../field/selected";

type MenuChoiceConfigsJson = {
    defaults?: MenuFieldConfigDefaultsJson;
    idle?: boolean | MenuFieldConfigIdleJson;
    hover?: boolean | MenuFieldConfigHoverJson;
    selected?: boolean | MenuFieldConfigSelectedJson;
    /**
     * When true, the selected prefix/color is shown on items that are "active" (checked).
     * Defaults to false — only enable on menus where persistent selection makes sense
     * (e.g. multi-select, language picker).
     */
    selectable?: boolean;
};

class MenuChoiceConfigs {
    protected defaults?: MenuFieldConfigDefaults;
    protected idle?: MenuFieldConfigIdle;
    protected hover?: MenuFieldConfigHover;
    protected selected?: MenuFieldConfigSelected;
    protected selectable: boolean = false;

    constructor(
        defaults?: MenuFieldConfigDefaults | MenuFieldConfigDefaultsJson,
        idle?: MenuFieldConfigIdle | MenuChoiceConfigsJson["idle"],
        hover?: MenuFieldConfigHover | MenuChoiceConfigsJson["hover"],
        selected?: MenuFieldConfigSelected | MenuChoiceConfigsJson["selected"],
        selectable?: boolean
    ) {
        if (defaults) this.setDefaults(defaults);
        if (idle) this.setIdle(idle);
        if (hover) this.setHover(hover);
        if (selected) this.setSelected(selected);
        if (selectable !== undefined) this.selectable = selectable;
    }

    public getDefaults(): MenuChoiceConfigs["defaults"] | undefined {
        return this.defaults;
    }
    public setDefaults(defaults?: MenuFieldConfigDefaults | MenuFieldConfigDefaultsJson): this {
        if (defaults instanceof MenuFieldConfigDefaults) {
            this.defaults = new MenuFieldConfigDefaults(defaults.getValues(), defaults.getCallback());
        } else if (typeof defaults === "object") {
            this.defaults = new MenuFieldConfigDefaults(defaults.values ?? [], defaults.callback);
        }
        return this;
    }

    public getIdle(): MenuChoiceConfigs["idle"] | undefined {
        return this.idle;
    }
    public setIdle(idle: Exclude<MenuFieldConfigIdle | MenuChoiceConfigsJson["idle"], undefined>): this {
        if (idle instanceof MenuFieldConfigIdle) {
            this.idle = new MenuFieldConfigIdle(
                idle.getPrefix() ?? Utility.getDefaultIdlePrefix(),
                idle.getColor() ?? Utility.getDefaultIdleColor(),
                idle.isUnderline(),
                idle.isItalic()
            );
        } else if (typeof idle === "object") {
            this.idle = new MenuFieldConfigIdle(
                idle.prefix ?? Utility.getDefaultIdlePrefix(),
                idle.color ?? Utility.getDefaultIdleColor(),
                idle.underline,
                idle.italic
            );
        } else if (idle === true) {
            this.idle = new MenuFieldConfigIdle(Utility.getDefaultIdlePrefix(), Utility.getDefaultIdleColor());
        }
        return this;
    }

    public getHover(): MenuChoiceConfigs["hover"] | undefined {
        return this.hover;
    }
    public setHover(hover: Exclude<MenuFieldConfigHover | MenuChoiceConfigsJson["hover"], undefined>): this {
        if (hover instanceof MenuFieldConfigHover) {
            this.hover = new MenuFieldConfigHover(
                hover.getPrefix() ?? Utility.getDefaultHoverPrefix(),
                hover.getColor() ?? Utility.getDefaultHoverColor(),
                hover.isUnderline(),
                hover.isItalic()
            );
        } else if (typeof hover === "object") {
            this.hover = new MenuFieldConfigHover(
                hover.prefix ?? Utility.getDefaultHoverPrefix(),
                hover.color ?? Utility.getDefaultHoverColor(),
                hover.underline,
                hover.italic
            );
        } else if (hover === true) {
            this.hover = new MenuFieldConfigHover(Utility.getDefaultHoverPrefix(), Utility.getDefaultHoverColor());
        }
        return this;
    }

    public getSelected(): MenuChoiceConfigs["selected"] | undefined {
        return this.selected;
    }
    public setSelected(selected: Exclude<MenuFieldConfigSelected | MenuChoiceConfigsJson["selected"], undefined>): this {
        if (selected instanceof MenuFieldConfigSelected) {
            this.selected = new MenuFieldConfigSelected(
                selected.getPrefix() ?? Utility.getDefaultSelectedPrefix(),
                selected.getColor() ?? Utility.getDefaultSelectedColor(),
                selected.isUnderline(),
                selected.isItalic()
            );
        } else if (typeof selected === "object") {
            this.selected = new MenuFieldConfigSelected(
                selected.prefix ?? Utility.getDefaultSelectedPrefix(),
                selected.color ?? Utility.getDefaultSelectedColor(),
                selected.underline,
                selected.italic
            );
        } else if (selected === true) {
            this.selected = new MenuFieldConfigSelected(Utility.getDefaultSelectedPrefix(), Utility.getDefaultSelectedColor());
        }
        return this;
    }

    public isSelectable(): boolean {
        return this.selectable;
    }
    public setSelectable(selectable: NonNullable<MenuChoiceConfigsJson["selectable"]>): this {
        this.selectable = selectable;
        return this;
    }

    public toJson(): MenuChoiceConfigsJson {
        return {
            ...(this.defaults
                ? { defaults: { values: this.defaults.getValues(), callback: this.defaults.getCallback() } }
                : {}),
            ...(this.idle
                ? { idle: { prefix: this.idle.getPrefix(), color: this.idle.getColor(), underline: this.idle.isUnderline(), italic: this.idle.isItalic() } }
                : {}),
            ...(this.hover
                ? { hover: { prefix: this.hover.getPrefix(), color: this.hover.getColor(), underline: this.hover.isUnderline(), italic: this.hover.isItalic() } }
                : {}),
            ...(this.selected
                ? { selected: { prefix: this.selected.getPrefix(), color: this.selected.getColor(), underline: this.selected.isUnderline(), italic: this.selected.isItalic() } }
                : {}),
            ...(this.selectable ? { selectable: true } : {}),
        };
    }
}

export { type MenuChoiceConfigsJson, MenuChoiceConfigs };