type Locale = "it" | "en" | "de";
type Dictionary = Record<string, string>;

export class Translation {
    private static current: Locale = "it";
    private static dictionaries: Record<string, Dictionary> = {
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

    /** 
     * Permette ai plugin di aggiungere nuove chiavi o estendere le lingue esistenti
     */
    public static extendLocale(locale: Locale, entries: Dictionary) {
        if (!this.dictionaries[locale]) {
            this.dictionaries[locale] = {};
        }
        this.dictionaries[locale] = {
            ...this.dictionaries[locale],
            ...entries,
        };
    }
}
