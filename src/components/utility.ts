import { config } from 'dotenv';
import { Language } from './translations';
import chalk, { ColorName } from 'chalk';
import { MenuInput } from "./menus";
import { appendFileSync, mkdirSync } from "fs";

class Utility {
    protected static defaultLanguage?: Language; // = 'en';
    protected static defaultPrefix?: string;
    protected static defaultColor?: ColorName;
    protected static debugLog: string = '';
    
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

        if(env.DEBUG_LOG === 'true') {
            try {
                const logsDir = `${process.cwd()}/logs`;

                mkdirSync(logsDir, { recursive: true });

                const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                Utility.debugLog = `${logsDir}/log-${timestamp}.log`
            } catch(err) {
                console.log(1, err)
            }
        }
    }

    public static getDefaultLanguage(): Language | undefined { return Utility.defaultLanguage; }
    public static getDefaultPrefix(): string | undefined { 
        return Utility.defaultPrefix; 
    }
    public static getDefaultColor(): ColorName | undefined { 
        return Utility.defaultColor; 
    }

    public static write(text?: string, color?: ColorName): string {
        return text ? ((color && chalk[color]) ? chalk[color](text) : text) : '';
    }

    public static isDebugLog(): boolean { return Utility.debugLog.length > 0; }
    public static log(value: string, force: boolean = false): void {
        if (Utility.isDebugLog() || force) {
            try {
                const cleanValue = value.replace(/\x1b\[[0-9;]*m/g, '');
                appendFileSync(Utility.debugLog, cleanValue + '\n');
            } catch(err) {
                console.log(2, err)
            }
        }
    }

    public static async pressAnyKey(message?: string): Promise<void> {
        // Use the new `input` prompt to pause and let the user press Enter.
        try {
            const pause = new MenuInput({
                name: 'press-to-continue',
                type: 'input',
                value: '',
                placeholder: message,
                clear: false,
            });

            await pause.run();
        } catch {
            // If prompt fails for any reason, fallback to a short delay so execution continues.
            await new Promise((resolve) => setTimeout(resolve, 300));
        }
    }
}

export { Utility };