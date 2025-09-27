import it from "./locales/it.json";
import en from "./locales/en.json";
import de from "./locales/de.json";

type Locale = "it" | "en" | "de";
type Dictionary = Record<string, string>;

export class Translation {
    private static current: Locale = "it";
    private static dictionaries: Record<Locale, Dictionary> = {
        it,
        en,
        de,
    };

    public static setLocale(locale: Locale) {
        this.current = locale;
    }

    public static t(key: string): string {
        return this.dictionaries[this.current][key] || key;
    }

    public static getLocale(): Locale {
        return this.current;
    }
}
