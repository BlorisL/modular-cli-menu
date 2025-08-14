import chalk, { ColorName } from "chalk";
import stripAnsi from 'strip-ansi';
import { Utility } from "./Utility";
import { LanguageCodeType, LanguagesType, LanguageType, RequestLanguagesType, TranslationType } from "@/types/Language";
import { Item } from "./Item";

Utility.loadEnv();

class Language {

    private code: LanguageCodeType;
    private translations: TranslationType;

    public constructor(options: LanguageType) {
        this.code = options.code ?? I18n.defaultLanguage;
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
    public add(items?: RequestLanguagesType | Language | LanguageType | Array<Language | LanguageType>): this {
        if (items !== undefined) {
            let code: LanguageCodeType | undefined = undefined;
            let translations: TranslationType = {};

            if (items instanceof Language) {
                code = items.getCode();
                translations = items.getTranslations() || {};
                //this.items[items.getCode()] = items;
            } else if (Array.isArray(items)) {
                items.forEach(item => {
                    this.add(item);
                    //if (item instanceof Language) {
                    //    this.items[item.getCode()] = item;
                    //} else if (typeof item === 'object' && item !== null && 'code' in item) {
                    //    // LanguageType
                    //    const lang = new Language(item as LanguageType);
                    //    this.items[lang.getCode()] = lang;
                    //}
                });
                return this;
            } else if (typeof items === 'object' && items !== null && 'code' in items) {
                // LanguageType
                code = (items as LanguageType).code;
                translations = (items as LanguageType).translations || {};
                //const lang = new Language(items as LanguageType);
                //this.items[lang.getCode()]?.addTranslations((items as LanguageType).translations);
            } else if (typeof items === 'object' && items !== null) {
                // LanguagesType
                Object.entries(items as RequestLanguagesType).forEach(([itemCode, lang]) => {
                    if (lang && typeof lang === 'object') {
                        lang = new Language({ code: itemCode as LanguageCodeType, translations: lang as TranslationType });
                    }
                    this.add(lang);
                //    if (lang instanceof Language) {
                //        if(lang.getTranslations()) {
                //            this.items[itemCode as LanguageCodeType]?.addTranslations(lang.getTranslations()!);
                //        }
                //    } else if (lang && typeof lang === 'object') {
                //        this.items[itemCode as LanguageCodeType]?.addTranslations(lang as TranslationType);
                //    }
                });
            }

            if(code) {
                if(this.items[code]) {
                    this.items[code]!.addTranslations(translations);
                } else {
                    this.items[code] = new Language({ code, translations });
                }
            }
        }
        return this;
    }
    public get(code: LanguageCodeType): Language | undefined {
        const lang = this.items[code];
        return lang instanceof Language ? lang : undefined;
    }

    public getCodes(): LanguageCodeType[] { return Object.keys(this.items) as LanguageCodeType[]; }

    public getTranslation(label: string, languageCode: LanguageCodeType = I18n.getSelectedLanguage()): string {
        const language = this.get(languageCode);
        if (language) {
            return language.getTranslation(label);
        }
        return label;
    }
}

class I18n {

    static defaultLanguage: LanguageCodeType = process.env.MENU_LANGUAGE as LanguageCodeType || 'en';

    private static selectedLanguage: LanguageCodeType = I18n.defaultLanguage;
    static getSelectedLanguage(): LanguageCodeType { return I18n.selectedLanguage; }
    static setSelectedLanguage(code: string): void { I18n.selectedLanguage = code as LanguageCodeType; }

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

    static getNameTranslation(item: Item): string {
        return I18n.getTranslation(item.getNameTranslation(), item.getColor());
    };

    static getMessageTranslation(item: Item): string {
        return I18n.getTranslation(item.getMessageTranslation(), item.getColor());
    };
}

export { Languages, Language, I18n };