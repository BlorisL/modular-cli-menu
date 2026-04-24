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

    public getPrefix(): StyleIdle["prefix"] {
        return this.prefix;
    }

    public setPrefix(prefix: StyleIdle["prefix"]): this {
        if (prefix && prefix.length > 0) {
            this.prefix = prefix;
        }
        return this;
    }

    public getColor(): StyleIdle["color"] | undefined {
        return this.color;
    }

    public setColor(color: StyleIdle["color"]): this {
        this.color = color;
        return this;
    }

    public isUnderline(): StyleIdle["underline"] | undefined {
        return this.underline;
    }

    public setUnderline(underline: StyleIdle["underline"]): this {
        this.underline = underline;
        return this;
    }

    public isItalic(): StyleIdle["italic"] | undefined {
        return this.italic;
    }

    public setItalic(italic: StyleIdle["italic"]): this {
        this.italic = italic;
        return this;
    }

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
