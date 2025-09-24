// i18n.ts
import chalk, { ColorName } from "chalk";
import stripAnsi from "strip-ansi";
import { Utility } from "../Utility";
import { Languages } from "./collection";
import { Language, LanguageCodeType } from "./item";

Utility.loadEnv();

class I18n {
    static defaultLanguage: LanguageCodeType = process.env.MENU_LANGUAGE as LanguageCodeType || 'en';

    private static selectedLanguage: LanguageCodeType = I18n.defaultLanguage;
    static getSelectedLanguage(): LanguageCodeType { return I18n.selectedLanguage; }
    static setSelectedLanguage(code: string): void { I18n.selectedLanguage = code as LanguageCodeType; }

    static languages: Languages = new Languages(
        new Language({ code: 'en' }),
        // new Language({ code: 'it' }),
    );

    static getTranslation(message?: string, color?: ColorName): string {
        if (!message || message.length === 0) return '';
        const translation = I18n.languages.getTranslation(message, I18n.getSelectedLanguage());
        return color ? chalk[color](translation) : stripAnsi(translation);
    }

    static toObject(): {
        defaultLanguage: LanguageCodeType;
        selectedLanguage: LanguageCodeType;
        languages: ReturnType<Languages["toObject"]>;
    } {
        return {
            defaultLanguage: I18n.defaultLanguage,
            selectedLanguage: I18n.selectedLanguage,
            languages: I18n.languages.toObject()
        };
    }
}

export { I18n };
