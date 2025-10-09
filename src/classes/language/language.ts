type LanguageType = 'en' | 'it' | 'fr' | 'de' | 'es' | 'pt' | 'ru' | 'zh' | 'ja';

type LanguageConfig = {
    code: LanguageType;
    translations: Record<string, string>;
}

class Language {
    protected code: LanguageType;
    protected translations: Record<string, string>;

    public constructor(options: LanguageConfig) {
        this.code = options.code;
        this.translations = options.translations || {};
    }

    public getCode(): LanguageType { return this.code; }

    public getTranslations(): Record<string, string> { return this.translations; }
    public addTranslations(translations: Record<string, string>): this {
        this.translations = { ...this.translations, ...translations };
        return this;
    }

    public getTranslation(key: string): string { return this.translations[key] || key; }
    public setTranslation(key: string, value: string): this { this.translations[key] = value; return this; }

    public toObject(): LanguageConfig {
        return {
            code: this.getCode(),
            translations: this.getTranslations(),
        };
    }
}

export {
    type LanguageType,
    Language,
    type LanguageConfig
}