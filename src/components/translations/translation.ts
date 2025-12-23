import { Utility } from "../utility";

type Language = string; //'en' | 'it' | 'fr' | 'de' | 'es' | 'pl' | 'ru' | 'cn' | 'jp' | 'ar';

type TranslationJson = Record<string, Partial<Record<Language, string>>>;

class Translations {
    protected static items: TranslationJson = {};

    public static getLanguages(): Language[] {
        const langs = new Set<Language>();
        Object.values(Translations.items).forEach(langObj => {
            Object.keys(langObj).forEach(lang => langs.add(lang));
        });
        return Array.from(langs);
    }

    public static getDefaultLanguage(): Language { return Utility.getDefaultLanguage(); }

    public static getTranslations(): TranslationJson { return Translations.items; }
    public static getTranslation(
        name: string, 
        language?: keyof TranslationJson[string]
    ): string {
        let lang = language;
        let value: string | undefined = undefined;

        if(language) {
            value = Translations.items[name]?.[language];
        }
        if(!value) {
            lang = Translations.getDefaultLanguage();
            value = Translations.items[name]?.[Translations.getDefaultLanguage()];
        }

        return value ?? `${name}.${lang}`;
    }
    public static addTranslations(items: TranslationJson): Translations {
        Object.entries(items).forEach(([name, langs]) => {
            Object.entries(langs).forEach(([language, text]) => {
                this.addTranslation(name, language as keyof TranslationJson[string], text!);
            });
        });
        return this;
    }
    public static addTranslation(
        name: string, 
        language: keyof TranslationJson[string], 
        text: string
    ): Translations {
        if(!Translations.items[name]) {
            Translations.items[name] = {};
        }
        Translations.items[name]![language] = text;
        return this;
    }
}

export { Translations, type Language, type TranslationJson };