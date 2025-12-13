import { config } from 'dotenv';

type Language = string; //'en' | 'it' | 'fr' | 'de' | 'es' | 'pl' | 'ru' | 'cn' | 'jp' | 'ar';

type TranslationJson = Record<string, Partial<Record<Language, string>>>;

class Translations {
    protected static defaultLanguage: Language; // = 'en';
    protected static selectedLanguage: Language; // = 'en';
    protected static items: TranslationJson = {};

    static {
        config({ path: '.env' });
        config({ path: '.env.local', override: true });
        
        Translations.defaultLanguage = process.env.DEFAULT_LANGUAGE || process.env.MENU_LANGUAGE || 'en';
        Translations.selectedLanguage = process.env.SELECTED_LANGUAGE || process.env.MENU_LANGUAGE || 'en';
    }

    public static getLanguages(): Language[] {
        const langs = new Set<Language>();
        Object.values(Translations.items).forEach(langObj => {
            Object.keys(langObj).forEach(lang => langs.add(lang));
        });
        return Array.from(langs);
    }

    public static getDefaultLanguage(): Language { return Translations.defaultLanguage; }

    public static getSelectedLanguage(): Language { return Translations.selectedLanguage; }
    public static setSelectedLanguage(language: Language): Translations {
        Translations.selectedLanguage = language;
        return this;
    }

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
            lang = Translations.selectedLanguage;
            value = Translations.items[name]?.[Translations.selectedLanguage];
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