import { ColorName } from "chalk";

type StyleIdleJson = {
    prefix?: string;
    color?: ColorName;
    underline?: boolean;
    italic?: boolean;
};

class StyleIdle {
    protected prefix?: StyleIdleJson["prefix"];
    protected color?: StyleIdleJson["color"];
    protected underline?: StyleIdleJson["underline"];
    protected italic?: StyleIdleJson["italic"];

    /**
     * Creates a new idle style with optional customization.
     * @param prefix Optional prefix string.
     * @param color Optional chalk color name.
     * @param underline Optional underline flag.
     * @param italic Optional italic flag.
     */
    constructor(
        prefix?: StyleIdleJson["prefix"],
        color?: StyleIdleJson["color"],
        underline?: StyleIdleJson["underline"],
        italic?: StyleIdleJson["italic"]
    ) {
        this.prefix = prefix;
        this.color = color;
        this.underline = underline;
        this.italic = italic;
    }

    /** Returns the prefix string displayed before the item label, or undefined to use the env default. */
    public getPrefix(): StyleIdle["prefix"] {
        return this.prefix;
    }

    /**
     * Sets the prefix string. Non-empty values are accepted; empty strings are ignored.
     * @param prefix Prefix to display before the label.
     */
    public setPrefix(prefix: StyleIdle["prefix"]): this {
        if (prefix && prefix.length > 0) {
            this.prefix = prefix;
        }
        return this;
    }

    /** Returns the chalk color for this style, or undefined to use the terminal default. */
    public getColor(): StyleIdle["color"] | undefined {
        return this.color;
    }

    /**
     * Sets the chalk color for this style.
     * @param color Chalk color name, or undefined to use the terminal default.
     */
    public setColor(color: StyleIdle["color"]): this {
        this.color = color;
        return this;
    }

    /** Returns the underline flag, or undefined if not explicitly set. */
    public isUnderline(): StyleIdle["underline"] | undefined {
        return this.underline;
    }

    /** Sets whether the text should be underlined. */
    public setUnderline(underline: StyleIdle["underline"]): this {
        this.underline = underline;
        return this;
    }

    /** Returns the italic flag, or undefined if not explicitly set. */
    public isItalic(): StyleIdle["italic"] | undefined {
        return this.italic;
    }

    /** Sets whether the text should be italic. */
    public setItalic(italic: StyleIdle["italic"]): this {
        this.italic = italic;
        return this;
    }

    /** Serialises the idle style to a plain JSON-compatible object. */
    public toJson(): StyleIdleJson {
        return {
            prefix: this.prefix,
            color: this.color,
            underline: this.underline,
            italic: this.italic,
        };
    }
}

export { type StyleIdleJson, StyleIdle };
