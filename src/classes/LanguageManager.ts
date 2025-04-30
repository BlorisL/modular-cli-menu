import fs from 'fs/promises';
import path from 'path';
import { Translations } from '@interfaces/Translations';
import { debugLog } from '@/utils/functions';

export class LanguageManager {
    private translations: Translations = {};
    private currentLang: string;

    constructor(defaultLang: string = 'en') {
        this.currentLang = defaultLang;
    }

    async loadLanguage(lang: string): Promise<void> {
        try {
            debugLog(`Loading language: ${lang}`);
            // Load global translations
            const globalFilePath = path.resolve(__dirname, '../../languages', `${lang}.json`);
            let translations: Translations = {};
            if (await fs.access(globalFilePath).then(() => true).catch(() => false)) {
                const data = await fs.readFile(globalFilePath, 'utf-8');
                translations = JSON.parse(data);
                debugLog(`Loaded global translations from ${globalFilePath}:`, JSON.stringify(translations, null, 2));
            } else {
                debugLog(`Global translation file ${globalFilePath} not found`);
            }

            // Load plugin translations
            const pluginsDir = path.resolve(__dirname, '../../plugins');
            const pluginFolders = await fs.readdir(pluginsDir);
            for (const folder of pluginFolders) {
                const pluginLangFile = path.join(pluginsDir, folder, 'languages', `${lang}.json`);
                if (await fs.access(pluginLangFile).then(() => true).catch(() => false)) {
                    const data = await fs.readFile(pluginLangFile, 'utf-8');
                    const pluginTranslations = JSON.parse(data);
                    debugLog(`Loaded plugin translations for ${folder} from ${pluginLangFile}:`, JSON.stringify(pluginTranslations, null, 2));
                    translations = this.deepMerge(translations, pluginTranslations);
                } else {
                    debugLog(`No translation file found for plugin ${folder} at ${pluginLangFile}`);
                }
            }

            this.translations = translations;
            this.currentLang = lang;
            debugLog(`Final translations loaded for ${lang}:`, JSON.stringify(this.translations, null, 2));

            // Verify specific keys
            const requiredKeys = ['actions.select_language', 'actions.language_changed', 'actions.exit'];
            for (const key of requiredKeys) {
                const translation = this.getTranslation(key);
                if (translation !== key) {
                    debugLog(`Key ${key} found: ${translation}`);
                } else {
                    debugLog(`Key ${key} not found in translations`);
                }
            }
        } catch (error) {
            debugLog(`Error loading language ${lang}:`, error);
            throw error;
        }
    }

    getTranslation(key: string): string {
        debugLog(`Looking for translation for key: ${key}`);
        const keys = key.split('.');
        let value: any = this.translations;

        for (const k of keys) {
            if (!value || typeof value !== 'object') {
                debugLog(`Translation not found for key: ${key} (stopped at ${k})`);
                return key;
            }
            value = value[k];
        }

        if (typeof value !== 'string') {
            debugLog(`Invalid translation for key: ${key}, value: ${JSON.stringify(value)}`);
            return key;
        }

        debugLog(`Translation found for ${key}: ${value}`);
        return value;
    }

    getCurrentLang(): string {
        return this.currentLang;
    }

    private deepMerge(target: any, source: any): any {
        const output = { ...target };
        for (const key in source) {
            if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                output[key] = this.deepMerge(output[key] || {}, source[key]);
            } else {
                if (output[key] !== undefined) {
                    debugLog(`Conflict in key ${key}: global="${output[key]}", plugin="${source[key]}"`);
                }
                output[key] = source[key];
            }
        }
        return output;
    }
}