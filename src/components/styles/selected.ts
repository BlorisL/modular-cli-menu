import { ColorName } from "chalk";

type StyleSelectedJson = {
    prefix?: string;
    color?: ColorName;
    underline?: boolean;
    italic?: boolean;
};

class StyleSelected {
    protected prefix?: StyleSelectedJson["prefix"];
    protected color?: StyleSelectedJson["color"];
    protected underline?: StyleSelectedJson["underline"];
    protected italic?: StyleSelectedJson["italic"];

    /**
     * Creates a new selected style with optional customization.
     * @param prefix Optional prefix string.
     * @param color Optional chalk color name.
     * @param underline Optional underline flag.
     * @param italic Optional italic flag.
     */
    constructor(
        prefix?: StyleSelectedJson["prefix"],
        color?: StyleSelectedJson["color"],
        underline?: StyleSelectedJson["underline"],
        italic?: StyleSelectedJson["italic"]
    ) {
        this.prefix = prefix;
        this.color = color;
        this.underline = underline;
        this.italic = italic;
    }

    /** Returns the prefix string displayed before the item label, or undefined to use the env default. */
    public getPrefix(): StyleSelected["prefix"] {
        return this.prefix;
    }

    /**
     * Sets the prefix string. Non-empty values are accepted; empty strings are ignored.
     * @param prefix Prefix to display before the label.
     */
    public setPrefix(prefix: StyleSelected["prefix"]): this {
        if (prefix && prefix.length > 0) {
            this.prefix = prefix;
        }
        return this;
    }

    /** Returns the chalk color for this style, or undefined to use the terminal default. */
    public getColor(): StyleSelected["color"] | undefined {
        return this.color;
    }

    /**
     * Sets the chalk color for this style.
     * @param color Chalk color name, or undefined to use the terminal default.
     */
    public setColor(color: StyleSelected["color"]): this {
        this.color = color;
        return this;
    }

    /** Returns the underline flag, or undefined if not explicitly set. */
    public isUnderline(): StyleSelected["underline"] | undefined {
        return this.underline;
    }

    /** Sets whether the text should be underlined. */
    public setUnderline(underline: StyleSelected["underline"]): this {
        this.underline = underline;
        return this;
    }

    /** Returns the italic flag, or undefined if not explicitly set. */
    public isItalic(): StyleSelected["italic"] | undefined {
        return this.italic;
    }

    /** Sets whether the text should be italic. */
    public setItalic(italic: StyleSelected["italic"]): this {
        this.italic = italic;
        return this;
    }

    /** Serialises the selected style to a plain JSON-compatible object. */
    public toJson(): StyleSelectedJson {
        return {
            prefix: this.prefix,
            color: this.color,
            underline: this.underline,
            italic: this.italic,
        };
    }
}

export { type StyleSelectedJson, StyleSelected };
