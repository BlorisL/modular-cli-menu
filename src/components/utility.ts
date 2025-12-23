import { config } from 'dotenv';
import { Language } from './translations';
import { ColorName } from 'chalk';

class Utility {
    protected static defaultLanguage: Language; // = 'en';
    protected static defaultLanguagePrefix?: string;
    protected static defaultLanguageColor?: ColorName;
    protected static debugLog: boolean;
    
    static {
        config({ path: '.env' });
        config({ path: '.env.local', override: true });

        const env = process.env;
        
        Utility.defaultLanguage = (env.DEFAULT_LANGUAGE && env.DEFAULT_LANGUAGE.length > 0)
            ? env.DEFAULT_LANGUAGE as Language
            : 'en'
        ;
        Utility.defaultLanguagePrefix = (env.DEFAULT_LANGUAGE_PREFIX && env.DEFAULT_LANGUAGE_PREFIX.length > 0) 
            ? env.DEFAULT_LANGUAGE_PREFIX
            : undefined
        ;
        Utility.defaultLanguageColor = (env.DEFAULT_LANGUAGE_COLOR && env.DEFAULT_LANGUAGE_COLOR.length > 0) 
            ? env.DEFAULT_LANGUAGE_COLOR as ColorName
            : undefined
        ;
        Utility.debugLog = env.DEBUG_LOG === 'true';
    }

    public static getDefaultLanguage(): Language { return Utility.defaultLanguage; }
    public static getDefaultLanguagePrefix(): string | undefined { 
        return Utility.defaultLanguagePrefix; 
    }
    public static getDefaultLanguageColor(): ColorName | undefined { 
        return Utility.defaultLanguageColor; 
    }
    public static isDebugLog(): boolean { return Utility.debugLog === true; }
}

export { Utility };