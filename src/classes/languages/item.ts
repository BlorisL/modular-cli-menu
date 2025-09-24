// item.ts
import { ColorName } from "chalk";

type LanguageCodeType = 'en' | 'it' | 'fr' | 'de' | 'es' | 'pt' | 'ru' | 'zh' | 'ja';
type TranslationType = Record<string, string>;

type LanguageType = {
    code: LanguageCodeType;
    translations?: TranslationType;
};

class Language {
    private code: LanguageCodeType;
    private translations: TranslationType;

    public constructor(options: LanguageType) {
        this.code = options.code;
        this.translations = options.translations ?? {};
    }

    public getCode(): LanguageCodeType { return this.code; }
    public setCode(code: LanguageCodeType): this { this.code = code; return this; }

    public getTranslations(): TranslationType { return this.translations; }
    public setTranslations(translations: TranslationType): this {
        this.translations = translations;
        return this;
    }

    public addTranslations(translations: TranslationType): this {
        this.translations = { ...this.translations, ...translations };
        return this;
    }

    public addTranslation(key: string, value: string): this {
        this.translations[key] = value;
        return this;
    }

    public getTranslation(key: string): string {
        return this.translations[key] || key;
    }

    public toObject(): LanguageType {
        return {
            code: this.code,
            translations: this.translations
        };
    }
}

export {
    Language,
    LanguageType,
    LanguageCodeType,
    TranslationType
};
