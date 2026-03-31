import { TranslationJson, Translations } from ".";
import { Utility } from "../utility";
import { ColorName } from "chalk";

class Label {
    protected name: string;
    protected callback?: (value: string | undefined, translate: (value: string) => string | undefined) => string;

    constructor(name: Label['name'], callback?: Label['callback']) {
        this.name = name;
        this.callback = callback;
    }

    public getName(): Label["name"] {
        return this.name;
    }
    public setName(name: Label["name"]): this {
        this.name = name;
        return this;
    }

    public getCallback(): Label["callback"] | undefined {
        return this.callback;
    }
    public setCallback(callback: Label["callback"]): this {
        this.callback = callback;
        return this;
    }

    public getValue(language?: keyof TranslationJson[string]): string {
        const translate = (value: string): string | undefined => Translations.getTranslation(value, language) ?? value;
        const value = translate(this.getName());
        return this.callback 
            ? this.callback(value, translate) 
            : (value ?? this.getName())
        ;
    }

    public write(style?: { prefix?: string; color?: ColorName }, language?: keyof TranslationJson[string]): string {
        return Utility.write(`${style?.prefix ?? ""}${this.getValue(language)}`, style?.color);
    }

    public toJson(): { name: string; value: string } {
        return {
            name: this.name,
            value: this.getValue(),
        };
    }
}

export { Label };