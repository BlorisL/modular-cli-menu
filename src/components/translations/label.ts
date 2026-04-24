import { TranslationJson, Translations } from "@/components/translations";
import { Utility } from "@/components/utility";
import { ColorName } from "chalk";

class Label {
    protected name: string;
    protected callback?: (value: string | undefined, translate: (value: string) => string | undefined) => string;

    constructor(name: Label["name"], callback?: Label["callback"]) {
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
        return this.callback ? this.callback(value, translate) : (value ?? this.getName());
    }

    public write(options?: {
        prefix?: string;
        color?: ColorName;
        language?: keyof TranslationJson[string];
        append?: string;
    }): string {
        const value = this.getValue(options?.language);
        const text = options?.prefix !== undefined ? `${options.prefix}${value}` : value;
        const full = options?.append !== undefined ? `${text} ${options.append}` : text;
        return Utility.write(full, options?.color);
    }

    public print(options?: {
        prefix?: string;
        color?: ColorName;
        language?: keyof TranslationJson[string];
        append?: string;
    }): void {
        console.log(this.write(options));
    }

    public toJson(): { name: string; value: string } {
        return {
            name: this.name,
            value: this.getValue(),
        };
    }
}

export { Label };
