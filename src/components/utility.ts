import { config } from 'dotenv';
import { Language } from './translations';
import chalk, { ColorName } from 'chalk';
import { MenuField } from './menus/field';

class Utility {
    protected static defaultLanguage?: Language; // = 'en';
    protected static defaultPrefix?: string;
    protected static defaultColor?: ColorName;
    protected static debugLog: boolean;
    
    static {
        config({ path: '.env' });
        config({ path: '.env.local', override: true });

        const env = process.env;
        
        Utility.defaultLanguage = (env.DEFAULT_LANGUAGE && env.DEFAULT_LANGUAGE.length > 0)
            ? env.DEFAULT_LANGUAGE as Language
            : undefined
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

    public static getDefaultLanguage(): Language | undefined { return Utility.defaultLanguage; }
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

    public static async pressAnyKey(message?: string): Promise<void> {
        // Use the new `input` prompt to pause and let the user press Enter.
        try {
            const pause = new MenuField({
                name: 'press-to-continue',
                type: 'field' as const,
                input: {
                    value: '',
                    placeholder: message,
                    clear: false,
                },
            });

            await pause.run();
        } catch {
            // If prompt fails for any reason, fallback to a short delay so execution continues.
            await new Promise((resolve) => setTimeout(resolve, 300));
        }
    }
}

export { Utility };