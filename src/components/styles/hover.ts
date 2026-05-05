import { ColorName } from "chalk";

type StyleHoverJson = {
    prefix?: string;
    color?: ColorName;
    underline?: boolean;
    italic?: boolean;
};

class StyleHover {
    protected prefix?: StyleHoverJson["prefix"];
    protected color?: StyleHoverJson["color"];
    protected underline?: StyleHoverJson["underline"];
    protected italic?: StyleHoverJson["italic"];

    /**
     * Creates a new hover style with optional customization.
     * @param prefix Optional prefix string.
     * @param color Optional chalk color name.
     * @param underline Optional underline flag.
     * @param italic Optional italic flag.
     */
    constructor(
        prefix?: StyleHoverJson["prefix"],
        color?: StyleHoverJson["color"],
        underline?: StyleHoverJson["underline"],
        italic?: StyleHoverJson["italic"]
    ) {
        this.prefix = prefix;
        this.color = color;
        this.underline = underline;
        this.italic = italic;
    }

    /** Returns the prefix string displayed before the item label, or undefined to use the env default. */
    public getPrefix(): StyleHover["prefix"] {
        return this.prefix;
    }

    /**
     * Sets the prefix string. Non-empty values are accepted; empty strings are ignored.
     * @param prefix Prefix to display before the label.
     */
    public setPrefix(prefix: StyleHover["prefix"]): this {
        if (prefix && prefix.length > 0) {
            this.prefix = prefix;
        }
        return this;
    }

    /** Returns the chalk color for this style, or undefined to use the terminal default. */
    public getColor(): StyleHover["color"] | undefined {
        return this.color;
    }

    /**
     * Sets the chalk color for this style.
     * @param color Chalk color name, or undefined to use the terminal default.
     */
    public setColor(color: StyleHover["color"]): this {
        this.color = color;
        return this;
    }

    /** Returns the underline flag, or undefined if not explicitly set. */
    public isUnderline(): StyleHover["underline"] | undefined {
        return this.underline;
    }

    /** Sets whether the text should be underlined. */
    public setUnderline(underline: StyleHover["underline"]): this {
        this.underline = underline;
        return this;
    }

    /** Returns the italic flag, or undefined if not explicitly set. */
    public isItalic(): StyleHover["italic"] | undefined {
        return this.italic;
    }

    /** Sets whether the text should be italic. */
    public setItalic(italic: StyleHover["italic"]): this {
        this.italic = italic;
        return this;
    }

    /** Serialises the hover style to a plain JSON-compatible object. */
    public toJson(): StyleHoverJson {
        return {
            prefix: this.prefix,
            color: this.color,
            underline: this.underline,
            italic: this.italic,
        };
    }
}

export { type StyleHoverJson, StyleHover };
