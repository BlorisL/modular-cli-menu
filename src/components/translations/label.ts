import { TranslationJson, Translations } from "@/components/translations";
import { Utility } from "@/components/utility";
import { ColorName } from "chalk";

class Label {
    protected name: string;
    protected callback?: (value: string | undefined, translate: (value: string) => string | undefined) => string;

    /**
     * Creates a new Label for translations.
     * @param name Translation key string (e.g., "plugin.action.title").
     * @param callback Optional interpolation function applied during translation lookup.
     */
    constructor(name: Label["name"], callback?: Label["callback"]) {
        this.name = name;
        this.callback = callback;
    }

    /** Returns the translation key name. */
    public getName(): Label["name"] {
        return this.name;
    }

    /**
     * Sets the translation key name.
     * @param name Translation key (e.g., "plugin.menu.question").
     */
    public setName(name: Label["name"]): this {
        this.name = name;
        return this;
    }

    /** Returns the optional interpolation callback, or undefined if not set. */
    public getCallback(): Label["callback"] | undefined {
        return this.callback;
    }

    /**
     * Sets the optional interpolation callback applied during translation lookup.
     * @param callback Function receiving translated value and translate helper.
     */
    public setCallback(callback: Label["callback"]): this {
        this.callback = callback;
        return this;
    }

    /**
     * Returns the translated value of this label.
     * Applies the optional interpolation callback if configured.
     * @param language Optional language override.
     */
    public getValue(language?: keyof TranslationJson[string]): string {
        const translate = (value: string): string | undefined => Translations.getTranslation(value, language) ?? value;
        const value = translate(this.getName());
        return this.callback ? this.callback(value, translate) : (value ?? this.getName());
    }

    /**
     * Renders and returns the translated label as a styled string.
     * @param prefix Optional prefix prepended to the value.
     * @param color Optional chalk color for styling.
     * @param language Optional language override.
     * @param append Optional suffix appended after a space.
     */
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

    /**
     * Renders and logs the translated label to console.
     * @param prefix Optional prefix prepended to the value.
     * @param color Optional chalk color for styling.
     * @param language Optional language override.
     * @param append Optional suffix appended after a space.
     */
    public print(options?: {
        prefix?: string;
        color?: ColorName;
        language?: keyof TranslationJson[string];
        append?: string;
    }): void {
        console.log(this.write(options));
    }

    /** Serialises the label to a plain JSON object with translation key and current value. */
    public toJson(): { name: string; value: string } {
        return {
            name: this.name,
            value: this.getValue(),
        };
    }
}

export { Label };
