import chalk, { ColorName } from "chalk";
import stripAnsi from 'strip-ansi';

type LanguageCodeType = 'en' | 'it' | 'fr' | 'de' | 'es' | 'pt' | 'ru' | 'zh' | 'ja';

type TranslationType = Record<string, string>;

type LanguageType = {
    code: LanguageCodeType;
    translations?: TranslationType;
}

type LanguagesType = Partial<Record<LanguageCodeType, Language | TranslationType>>;

class Language {

    static readonly DEFAULT_LANGUAGE: LanguageCodeType = 'en';

    private code: LanguageCodeType;
    private translations: TranslationType;

    public constructor(options: LanguageType) {
        this.code = options.code ?? Language.DEFAULT_LANGUAGE;
        this.translations = options.translations ?? {};
    }

    public getCode(): LanguageCodeType { return this.code; }
    public setCode(code: LanguageCodeType): this { this.code = code; return this; }

    public getTranslations(): TranslationType | undefined { return this.translations; }
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
}

class Languages {
    private items: LanguagesType;

    public constructor(...languages: Language[]) {
        this.items = {};

        languages.map(language => this.add(language));
    }

    public getAll(): LanguagesType { return this.items; }
    public add(items?: LanguagesType | Language | LanguageType | Array<Language | LanguageType>): this {
        if (items !== undefined) {
            if (items instanceof Language) {
                this.items[items.getCode()] = items;
            } else if (Array.isArray(items)) {
                items.forEach(item => {
                    if (item instanceof Language) {
                        this.items[item.getCode()] = item;
                    } else if (typeof item === 'object' && item !== null && 'code' in item) {
                        // LanguageType
                        const lang = new Language(item as LanguageType);
                        this.items[lang.getCode()] = lang;
                    }
                });
            } else if (typeof items === 'object' && items !== null && 'code' in items) {
                // LanguageType
                const lang = new Language(items as LanguageType);
                this.items[lang.getCode()] = lang;
            } else if (typeof items === 'object' && items !== null) {
                // LanguagesType
                Object.entries(items as LanguagesType).forEach(([code, lang]) => {
                    if (lang instanceof Language) {
                        this.items[code as LanguageCodeType] = lang;
                    } else if (lang && typeof lang === 'object') {
                        this.items[code as LanguageCodeType] = new Language({ code: code as LanguageCodeType, translations: lang as TranslationType });
                    }
                });
            }
        }
        return this;
    }
    public get(code: LanguageCodeType): Language | undefined {
        const lang = this.items[code];
        return lang instanceof Language ? lang : undefined;
    }

    public getCodes(): LanguageCodeType[] {
        return Object.keys(this.items) as LanguageCodeType[];
    }

    public getTranslation(label: string, languageCode: LanguageCodeType = Language.DEFAULT_LANGUAGE): string {
        const language = this.get(languageCode);
        if (language) {
            return language.getTranslation(label);
        }
        return label;
    }
}

class I18n {
    static languages: Languages = new Languages(
        new Language({ code: 'en' }),
        //new Language({ code: 'it' }),
    );

    static getTranslation(message?: string, color?: ColorName): string {
        let text = '';
        if(message && message.length > 0) {
            const translation = I18n.languages.getTranslation(message);
            text = color ? chalk[color](translation) : stripAnsi(translation);
        }
        return text;
    };
}

export { type LanguagesType, Languages, type LanguageType, Language, LanguageCodeType, TranslationType, I18n };