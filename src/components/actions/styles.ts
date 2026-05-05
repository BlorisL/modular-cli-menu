import {
    StyleHover,
    StyleHoverJson,
    StyleIdle,
    StyleIdleJson,
    StyleSelected,
    StyleSelectedJson,
} from "@/components/styles";

type ActionStylesJson = {
    idle?: StyleIdleJson;
    hover?: StyleHoverJson;
    selected?: StyleSelectedJson;
};

class ActionStyles {
    private idle?: StyleIdle;
    private hover?: StyleHover;
    private selected?: StyleSelected;

    /**
     * Creates a new ActionStyles container.
     * @param data Optional JSON object with idle, hover, and selected style configs.
     */
    constructor(data?: ActionStylesJson) {
        this.idle = data?.idle
            ? new StyleIdle(data.idle.prefix, data.idle.color, data.idle.underline, data.idle.italic)
            : undefined
        ;
        this.hover = data?.hover
            ? new StyleHover(data.hover.prefix, data.hover.color, data.hover.underline, data.hover.italic)
            : undefined
        ;
        this.selected = data?.selected
            ? new StyleSelected(
                    data.selected.prefix,
                    data.selected.color,
                    data.selected.underline,
                    data.selected.italic
                )
            : undefined
        ;
    }

    /** Returns the idle style, or undefined if not customised. */
    public getIdle(): StyleIdle | undefined {
        return this.idle;
    }

    /**
     * Sets the idle style from an instance or a plain JSON object.
     * @param idle StyleIdle instance or compatible JSON.
     */
    public setIdle(idle: StyleIdle): this;
    public setIdle(idle: StyleIdleJson): this;
    public setIdle(idle: StyleIdle | StyleIdleJson): this {
        this.idle =
            idle instanceof StyleIdle ? idle : new StyleIdle(idle.prefix, idle.color, idle.underline, idle.italic);
        return this;
    }

    /** Returns the hover style, or undefined if not customised. */
    public getHover(): StyleHover | undefined {
        return this.hover;
    }

    /**
     * Sets the hover style from an instance or a plain JSON object.
     * @param hover StyleHover instance or compatible JSON.
     */
    public setHover(hover: StyleHover): this;
    public setHover(hover: StyleHoverJson): this;
    public setHover(hover: StyleHover | StyleHoverJson): this {
        this.hover = hover instanceof StyleHover
            ? hover
            : new StyleHover(hover.prefix, hover.color, hover.underline, hover.italic)
        ;
        return this;
    }

    /** Returns the selected style, or undefined if not customised. */
    public getSelected(): StyleSelected | undefined {
        return this.selected;
    }

    /**
     * Sets the selected style from an instance or a plain JSON object.
     * @param selected StyleSelected instance or compatible JSON.
     */
    public setSelected(selected: StyleSelected): this;
    public setSelected(selected: StyleSelectedJson): this;
    public setSelected(selected: StyleSelected | StyleSelectedJson): this {
        this.selected = selected instanceof StyleSelected
            ? selected
            : new StyleSelected(selected.prefix, selected.color, selected.underline, selected.italic)
        ;
        return this;
    }

    /** Serialises the action styles to a plain JSON-compatible object. */
    public toJson(): ActionStylesJson {
        return {
            ...(this.idle ? { idle: this.idle.toJson() } : {}),
            ...(this.hover ? { hover: this.hover.toJson() } : {}),
            ...(this.selected ? { selected: this.selected.toJson() } : {}),
        };
    }
}

export { type ActionStylesJson, ActionStyles };
