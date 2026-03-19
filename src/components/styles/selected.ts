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

    public getPrefix(): StyleSelected["prefix"] {
        return this.prefix;
    }
    public setPrefix(prefix: StyleSelected["prefix"]): this {
        if (prefix && prefix.length > 0) {
            this.prefix = prefix;
        }
        return this;
    }

    public getColor(): StyleSelected["color"] | undefined {
        return this.color;
    }
    public setColor(color: StyleSelected["color"]): this {
        this.color = color;
        return this;
    }

    public isUnderline(): StyleSelected["underline"] | undefined {
        return this.underline;
    }
    public setUnderline(underline: StyleSelected["underline"]): this {
        this.underline = underline;
        return this;
    }

    public isItalic(): StyleSelected["italic"] | undefined {
        return this.italic;
    }
    public setItalic(italic: StyleSelected["italic"]): this {
        this.italic = italic;
        return this;
    }

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
