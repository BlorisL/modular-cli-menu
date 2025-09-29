type LanguageType = 'en' | 'it' | 'fr' | 'de' | 'es' | 'pt' | 'ru' | 'zh' | 'ja';

type LanguageConfig = {
    code: LanguageType;
    translations: Record<string, string>;
}

type LanguageCollection = Record<LanguageType, Language>;

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
}

class I18n {
    protected items: Partial<LanguageCollection> = {};

    public constructor( ...languages: LanguageConfig[]) {
        languages.forEach(lang => this.add(lang));
    }

    public getAll(): Language[] { return Object.values(this.items); }

    public get(code: LanguageType): Language | undefined { return this.items[code]; }
    public add(languages: Language | LanguageConfig | Array<Language | LanguageConfig>): this {
        if (!Array.isArray(languages)) {
            languages = [languages];
        }
        languages.forEach(lang => {
            if (!(lang instanceof Language)) {
                lang = new Language(lang);
            }
            if(this.items[lang.getCode()]) {
                this.items[lang.getCode()]?.addTranslations(lang.getTranslations());
            } else {
                this.items[lang.getCode()] = lang;
            }
        });
        return this;
    }

    public getTranslation(message: string, code: LanguageType): string {
        const lang = this.get(code);
        return lang ? lang.getTranslation(message) : message;
    }

}

export {
    Language,
    I18n,
    type LanguageType,
    type LanguageConfig,
    type LanguageCollection
}
