import { Utility } from "@/components/utility";
import { MenuFieldConfigDefaults, MenuFieldConfigDefaultsJson } from "./defaults";
import { MenuFieldConfigIdle, MenuFieldConfigIdleJson } from "./idle";
import { MenuFieldConfigHover, MenuFieldConfigHoverJson } from "./hover";
import { MenuFieldConfigSelected, MenuFieldConfigSelectedJson } from "./selected";

type MenuFieldConfigsJson = {
    defaults?: MenuFieldConfigDefaultsJson;
    idle?: boolean | MenuFieldConfigIdleJson;
    hover?: boolean | MenuFieldConfigHoverJson;
    selected?: boolean | MenuFieldConfigSelectedJson;
    /** When true, the selected prefix/color is shown on items that are "active" (checked).
     *  Defaults to false — only enable on menus where persistent selection makes sense
     *  (e.g. multi-select, language picker). */
    selectable?: boolean;
};

class MenuFieldConfigs {
    protected defaults?: MenuFieldConfigDefaults;
    protected idle?: MenuFieldConfigIdle;
    protected hover?: MenuFieldConfigHover;
    protected selected?: MenuFieldConfigSelected;
    protected selectable: boolean = false;

    constructor(
        defaults?: MenuFieldConfigDefaults | MenuFieldConfigDefaultsJson,
        idle?: MenuFieldConfigIdle | MenuFieldConfigsJson["idle"],
        hover?: MenuFieldConfigHover | MenuFieldConfigsJson["hover"],
        selected?: MenuFieldConfigSelected | MenuFieldConfigsJson["selected"],
        selectable?: boolean
    ) {
        if (defaults) {
            this.setDefaults(defaults);
        }
        if (idle) {
            this.setIdle(idle);
        }
        if (hover) {
            this.setHover(hover);
        }
        if (selected) {
            this.setSelected(selected);
        }
        if (selectable !== undefined) {
            this.selectable = selectable;
        }
    }

    public getDefaults(): MenuFieldConfigs["defaults"] | undefined {
        return this.defaults;
    }
    public setDefaults(defaults?: MenuFieldConfigDefaults | MenuFieldConfigDefaultsJson): this {
        if (defaults instanceof MenuFieldConfigDefaults) {
            this.defaults = new MenuFieldConfigDefaults(
                defaults.getValues(),
                defaults.getCallback()
            );
        } else if (typeof defaults === "object") {
            this.defaults = new MenuFieldConfigDefaults(defaults.values ?? [], defaults.callback);
        }
        return this;
    }

    public getIdle(): MenuFieldConfigs["idle"] | undefined {
        return this.idle;
    }
    public setIdle(
        idle: Exclude<MenuFieldConfigIdle | MenuFieldConfigsJson["idle"], undefined>
    ): this {
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
            this.idle = new MenuFieldConfigIdle(
                Utility.getDefaultIdlePrefix(),
                Utility.getDefaultIdleColor()
            );
        }
        return this;
    }

    public getHover(): MenuFieldConfigs["hover"] | undefined {
        return this.hover;
    }
    public setHover(
        hover: Exclude<MenuFieldConfigHover | MenuFieldConfigsJson["hover"], undefined>
    ): this {
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
            this.hover = new MenuFieldConfigHover(
                Utility.getDefaultHoverPrefix(),
                Utility.getDefaultHoverColor()
            );
        }
        return this;
    }

    public getSelected(): MenuFieldConfigs["selected"] | undefined {
        return this.selected;
    }
    public setSelected(
        selected: Exclude<MenuFieldConfigSelected | MenuFieldConfigsJson["selected"], undefined>
    ): this {
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
            this.selected = new MenuFieldConfigSelected(
                Utility.getDefaultSelectedPrefix(),
                Utility.getDefaultSelectedColor()
            );
        }
        return this;
    }

    public isSelectable(): boolean {
        return this.selectable;
    }
    public setSelectable(selectable: boolean): this {
        this.selectable = selectable;
        return this;
    }

    public toJson(): MenuFieldConfigsJson {
        const defaults = this.defaults
            ? {
                  values: this.defaults.getValues(),
                  callback: this.defaults.getCallback(),
              }
            : undefined;
        const idle = this.idle
            ? {
                  prefix: this.idle.getPrefix(),
                  color: this.idle.getColor(),
                  underline: this.idle.isUnderline(),
                  italic: this.idle.isItalic(),
              }
            : undefined;
        const hover = this.hover
            ? {
                  prefix: this.hover.getPrefix(),
                  color: this.hover.getColor(),
                  underline: this.hover.isUnderline(),
                  italic: this.hover.isItalic(),
              }
            : undefined;
        const selected = this.selected
            ? {
                  prefix: this.selected.getPrefix(),
                  color: this.selected.getColor(),
                  underline: this.selected.isUnderline(),
                  italic: this.selected.isItalic(),
              }
            : undefined;
        return {
            ...(defaults ? { defaults } : {}),
            ...(idle ? { idle } : {}),
            ...(hover ? { hover } : {}),
            ...(selected ? { selected } : {}),
            ...(this.selectable ? { selectable: true } : {}),
        };
    }
}

export { type MenuFieldConfigsJson, MenuFieldConfigs };
