import en from './languages/en.json';
import it from './languages/it.json';

type TranslationDictionary = {
    [key: string]: string;
};

let languages = { en, it };

export function updateLanguages(pluginLanguages: Record<string, Record<string, string>>) {
    Object.keys(languages).forEach(language => {
        if (pluginLanguages[language]) {
            languages[language as keyof typeof languages] = { 
                ...languages[language as keyof typeof languages], 
                ...pluginLanguages[language]
            };
        }
    });
}

type LanguageTypes = keyof typeof languages;
type Languages = Record<LanguageTypes, TranslationDictionary>;

const translations: Languages = languages;

function getLanguages(): LanguageTypes[] {
    return Object.keys(languages) as LanguageTypes[];
}

function getLanguage(): LanguageTypes {
    return (process.env.MENU_LANGUAGE || 'en') as LanguageTypes;
}

function getTranslation(label: string, language?: LanguageTypes): string {
    return translations[language ?? getLanguage()][label] || label;
}

export { getLanguages, getLanguage, getTranslation };