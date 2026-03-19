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

    public getPrefix(): StyleHover["prefix"] {
        return this.prefix;
    }
    public setPrefix(prefix: StyleHover["prefix"]): this {
        if (prefix && prefix.length > 0) {
            this.prefix = prefix;
        }
        return this;
    }

    public getColor(): StyleHover["color"] | undefined {
        return this.color;
    }
    public setColor(color: StyleHover["color"]): this {
        this.color = color;
        return this;
    }

    public isUnderline(): StyleHover["underline"] | undefined {
        return this.underline;
    }
    public setUnderline(underline: StyleHover["underline"]): this {
        this.underline = underline;
        return this;
    }

    public isItalic(): StyleHover["italic"] | undefined {
        return this.italic;
    }
    public setItalic(italic: StyleHover["italic"]): this {
        this.italic = italic;
        return this;
    }

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
