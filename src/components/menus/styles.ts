import { StyleHover, StyleHoverJson, StyleIdle, StyleIdleJson, StyleSelected, StyleSelectedJson } from "../styles";

type MenuStylesJson = {
    idle?: StyleIdleJson;
    hover?: StyleHoverJson;
    selected?: StyleSelectedJson;
};

class MenuStyles {
    private idle?: StyleIdle;
    private hover?: StyleHover;
    private selected?: StyleSelected;

    constructor(data?: MenuStylesJson) {
        this.idle = data?.idle
            ? new StyleIdle(data.idle.prefix, data.idle.color, data.idle.underline, data.idle.italic)
            : undefined;
        this.hover = data?.hover
            ? new StyleHover(data.hover.prefix, data.hover.color, data.hover.underline, data.hover.italic)
            : undefined;
        this.selected = data?.selected
            ? new StyleSelected(data.selected.prefix, data.selected.color, data.selected.underline, data.selected.italic)
            : undefined;
    }

    public getIdle(): StyleIdle | undefined {
        return this.idle;
    }
    public setIdle(idle: StyleIdle | StyleIdleJson): this {
        this.idle = idle instanceof StyleIdle ? idle : new StyleIdle(idle.prefix, idle.color, idle.underline, idle.italic);
        return this;
    }

    public getHover(): StyleHover | undefined {
        return this.hover;
    }
    public setHover(hover: StyleHover | StyleHoverJson): this {
        this.hover = hover instanceof StyleHover ? hover : new StyleHover(hover.prefix, hover.color, hover.underline, hover.italic);
        return this;
    }

    public getSelected(): StyleSelected | undefined {
        return this.selected;
    }
    public setSelected(selected: StyleSelected | StyleSelectedJson): this {
        this.selected = selected instanceof StyleSelected ? selected : new StyleSelected(selected.prefix, selected.color, selected.underline, selected.italic);
        return this;
    }

    public toJson(): MenuStylesJson {
        return {
            ...(this.idle ? { idle: this.idle.toJson() } : {}),
            ...(this.hover ? { hover: this.hover.toJson() } : {}),
            ...(this.selected ? { selected: this.selected.toJson() } : {}),
        };
    }
}

export { type MenuStylesJson, MenuStyles };