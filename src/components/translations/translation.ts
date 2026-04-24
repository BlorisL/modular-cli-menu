import { Utility } from "@/components/utility";

type Language = string;

type TranslationJson = Record<string, Partial<Record<Language, string>>>;

class Translations {
    protected static items: TranslationJson = {};
    protected static currentLanguage: Language | undefined = Utility.getDefaultLanguage();

    /**
     * Returns the active language, or undefined if translations are disabled
     * (i.e. DEFAULT_LANGUAGE is not set in the environment).
     */
    public static getCurrentLanguage(): Language | undefined {
        return Translations.currentLanguage;
    }

    public static setCurrentLanguage(language: Language): void {
        Translations.currentLanguage = language;
    }

    /** Returns true when translations are active (DEFAULT_LANGUAGE is set). */
    public static isEnabled(): boolean {
        return Translations.currentLanguage !== undefined;
    }

    /**
     * Returns the currently selected language.
     * Returns undefined when translations are disabled (DEFAULT_LANGUAGE not set).
     */
    public static getSelectedLanguage(): Language | undefined {
        return Translations.currentLanguage;
    }

    public static getLanguages(): Language[] {
        const langs = new Set<Language>();
        Object.values(Translations.items).forEach((langObj) => {
            Object.keys(langObj).forEach((lang) => langs.add(lang));
        });
        return Array.from(langs);
    }

    public static getDefaultLanguage(): Language | undefined {
        return Utility.getDefaultLanguage();
    }

    public static getTranslations(): TranslationJson {
        return Translations.items;
    }

    public static getTranslation(name: string, language?: keyof TranslationJson[string]): string {
        const lang = language ?? Translations.currentLanguage;
        let value: string = name;
        if (lang) {
            let translated: (typeof Translations)["items"][string][typeof lang] | undefined = undefined;
            try {
                translated = Translations.items[name]?.[lang];
            } catch {
                // console.error(`Error retrieving translation for key "${name}" and language "${lang}":`, error);
            }
            value = translated ?? name;
        }
        return value;
    }

    public static addTranslations(items: TranslationJson): Translations {
        Object.entries(items).forEach(([name, langs]) => {
            Object.entries(langs).forEach(([language, text]) => {
                this.addTranslation(name, language as keyof TranslationJson[string], text!);
            });
        });
        return this;
    }

    public static addTranslation(name: string, language: keyof TranslationJson[string], text: string): Translations {
        if (!Translations.items[name]) {
            Translations.items[name] = {};
        }
        Translations.items[name]![language] = text;
        return this;
    }
}

export { Translations, type Language, type TranslationJson };
