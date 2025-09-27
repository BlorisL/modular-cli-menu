// collection.ts
import { Language, LanguageType, LanguageCodeType, TranslationType } from "./item";

type RequestLanguagesType = Partial<Record<LanguageCodeType, Language | TranslationType>>;
type LanguagesType = Partial<Record<LanguageCodeType, Language>>;

class Languages {
    private items: LanguagesType;

    public constructor(...languages: Language[]) {
        this.items = {};
        languages.forEach(language => this.add(language));
    }

    public getAll(): LanguagesType { return this.items; }

    public add(items?: RequestLanguagesType | Language | LanguageType | Array<Language | LanguageType>): this {
        if (items !== undefined) {
            let code: LanguageCodeType | undefined;
            let translations: TranslationType = {};

            if (items instanceof Language) {
                code = items.getCode();
                translations = items.getTranslations();
            } else if (Array.isArray(items)) {
                items.forEach(item => this.add(item));
                return this;
            } else if (typeof items === 'object' && items !== null && 'code' in items) {
                code = (items as LanguageType).code;
                translations = (items as LanguageType).translations || {};
            } else if (typeof items === 'object' && items !== null) {
                Object.entries(items as RequestLanguagesType).forEach(([itemCode, lang]) => {
                    if (lang && typeof lang === 'object') {
                        lang = new Language({ code: itemCode as LanguageCodeType, translations: lang as TranslationType });
                    }
                    this.add(lang);
                });
            }

            if (code) {
                if (this.items[code]) {
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

    public getCodes(): LanguageCodeType[] {
        return Object.keys(this.items) as LanguageCodeType[];
    }

    public getTranslation(label: string, languageCode: LanguageCodeType): string {
        const language = this.get(languageCode);
        return language ? language.getTranslation(label) : label;
    }

    public toObject(): Record<LanguageCodeType, LanguageType> {
        const obj: Record<string, LanguageType> = {};
        Object.entries(this.items).forEach(([code, lang]) => {
            if (lang) {
                obj[code] = lang.toObject();
            }
        });
        return obj as Record<LanguageCodeType, LanguageType>;
    }
}

export {
    Languages,
    LanguagesType,
    RequestLanguagesType
};
