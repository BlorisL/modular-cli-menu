import { Language } from "@/classes/Language";

export type LanguageCodeType = 'en' | 'it' | 'fr' | 'de' | 'es' | 'pt' | 'ru' | 'zh' | 'ja';

export type TranslationType = Record<string, string>;

export type LanguageType = {
    code: LanguageCodeType;
    translations?: TranslationType;
}

export type RequestLanguagesType = Partial<Record<LanguageCodeType, Language | TranslationType>>;
export type LanguagesType = Partial<Record<LanguageCodeType, Language>>;