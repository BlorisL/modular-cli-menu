import { Language, LanguageConfig, LanguageType } from "./language";


type LanguageCollection = Record<LanguageType, Language>;


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
    I18n
}