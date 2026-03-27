import { config } from "dotenv";
import { Language } from "./translations";
import chalk, { ColorName } from "chalk";
import { MenuInput } from "./menus";
import { appendFileSync, mkdirSync } from "fs";

class Utility {
    protected static debugLog: string = "";
    protected static defaultLanguage?: Language;

    // Choice defaults
    protected static defaultIdlePrefix?: string;
    protected static defaultIdleColor?: ColorName;
    protected static defaultHoverPrefix?: string;
    protected static defaultHoverColor?: ColorName;
    protected static defaultSelectedPrefix?: string;
    protected static defaultSelectedColor?: ColorName;
    protected static defaultIdleUnderline?: boolean;
    protected static defaultHoverUnderline?: boolean;
    protected static defaultSelectedUnderline?: boolean;

    static {
        config({ path: ".env" });
        config({ path: ".env.local", override: true });

        const env = process.env;
        const envString = (value?: string): string | undefined => {
            if (value && value.length > 0) {
                return value;
            }
            return undefined;
        };
        const envBool = (value?: string): boolean | undefined => {
            if (value && value.length > 0) {
                return value === "true";
            }
            return undefined;
        };

        if (env.DEBUG_LOG === "true") {
            try {
                const logsDir = `${process.cwd()}/logs`;

                mkdirSync(logsDir, { recursive: true });

                const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
                Utility.debugLog = `${logsDir}/log-${timestamp}.log`;
            } catch (err) {
                console.log(1, err);
            }
        }

        Utility.defaultLanguage = envString(env.DEFAULT_LANGUAGE) as Language | undefined;
        Utility.defaultIdlePrefix = envString(env.DEFAULT_CHOICE_IDLE_PREFIX);
        Utility.defaultIdleColor = envString(env.DEFAULT_CHOICE_IDLE_COLOR) as ColorName | undefined;
        Utility.defaultHoverPrefix = envString(env.DEFAULT_CHOICE_HOVER_PREFIX);
        Utility.defaultHoverColor = envString(env.DEFAULT_CHOICE_HOVER_COLOR) as ColorName | undefined;
        Utility.defaultSelectedPrefix = envString(env.DEFAULT_CHOICE_SELECTED_PREFIX);
        Utility.defaultSelectedColor = envString(env.DEFAULT_CHOICE_SELECTED_COLOR) as ColorName | undefined;
        Utility.defaultIdleUnderline = envBool(env.DEFAULT_CHOICE_IDLE_UNDERLINE);
        Utility.defaultHoverUnderline = envBool(env.DEFAULT_CHOICE_HOVER_UNDERLINE);
        Utility.defaultSelectedUnderline = envBool(env.DEFAULT_CHOICE_SELECTED_UNDERLINE);
    }

    public static isDebugLog(): boolean {
        return Utility.debugLog.length > 0;
    }
    public static log(value: string, force: boolean = false): void {
        if (Utility.isDebugLog() || force) {
            try {
                const cleanValue = value.replace(/\x1b\[[0-9;]*m/g, "");
                appendFileSync(Utility.debugLog, cleanValue + "\n");
            } catch (err) {
                console.log(2, err);
            }
        }
    }

    public static getDefaultLanguage(): Language | undefined {
        return Utility.defaultLanguage;
    }

    public static getDefaultIdlePrefix(): string | undefined {
        return Utility.defaultIdlePrefix;
    }
    public static getDefaultIdleColor(): ColorName | undefined {
        return Utility.defaultIdleColor;
    }

    public static getDefaultHoverPrefix(): string | undefined {
        return Utility.defaultHoverPrefix;
    }
    public static getDefaultHoverColor(): ColorName | undefined {
        return Utility.defaultHoverColor;
    }

    public static getDefaultSelectedPrefix(): string | undefined {
        return Utility.defaultSelectedPrefix;
    }
    public static getDefaultSelectedColor(): ColorName | undefined {
        return Utility.defaultSelectedColor;
    }

    public static getDefaultIdleUnderline(): boolean | undefined {
        return Utility.defaultIdleUnderline;
    }
    public static getDefaultHoverUnderline(): boolean | undefined {
        return Utility.defaultHoverUnderline;
    }
    public static getDefaultSelectedUnderline(): boolean | undefined {
        return Utility.defaultSelectedUnderline;
    }

    public static write(text?: string, color?: ColorName): string {
        return text ? (color && chalk[color] ? chalk[color](text) : text) : "";
    }

    public static async pressAnyKey(message?: string): Promise<void> {
        try {
            const pause = new MenuInput({
                name: "press-to-continue",
                type: "input",
                value: "",
                configs: {
                    placeholder: message,
                    clear: false,
                },
            });

            await pause.run();
        } catch {
            await new Promise((resolve) => setTimeout(resolve, 300));
        }
    }
}

export { Utility };
