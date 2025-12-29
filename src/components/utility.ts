import { config } from 'dotenv';
import { Language } from './translations';
import chalk, { ColorName } from 'chalk';

class Utility {
    protected static defaultLanguage: Language; // = 'en';
    protected static defaultPrefix?: string;
    protected static defaultColor?: ColorName;
    protected static debugLog: boolean;
    
    static {
        config({ path: '.env' });
        config({ path: '.env.local', override: true });

        const env = process.env;
        
        Utility.defaultLanguage = (env.DEFAULT_LANGUAGE && env.DEFAULT_LANGUAGE.length > 0)
            ? env.DEFAULT_LANGUAGE as Language
            : 'en'
        ;
        Utility.defaultPrefix = (env.DEFAULT_CHOICE_PREFIX && env.DEFAULT_CHOICE_PREFIX.length > 0) 
            ? env.DEFAULT_CHOICE_PREFIX
            : undefined
        ;
        Utility.defaultColor = (env.DEFAULT_CHOICE_COLOR && env.DEFAULT_CHOICE_COLOR.length > 0) 
            ? env.DEFAULT_CHOICE_COLOR as ColorName
            : undefined
        ;
        Utility.debugLog = env.DEBUG_LOG === 'true';
    }

    public static getDefaultLanguage(): Language { return Utility.defaultLanguage; }
    public static getDefaultPrefix(): string | undefined { 
        return Utility.defaultPrefix; 
    }
    public static getDefaultColor(): ColorName | undefined { 
        return Utility.defaultColor; 
    }
    public static isDebugLog(): boolean { return Utility.debugLog === true; }

    public static write(text?: string, color?: ColorName): string {
        return text ? ((color && chalk[color]) ? chalk[color](text) : text) : '';
    }
}

export { Utility };