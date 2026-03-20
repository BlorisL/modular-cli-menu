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

        Utility.defaultLanguage =
            env.DEFAULT_LANGUAGE && env.DEFAULT_LANGUAGE.length > 0
                ? (env.DEFAULT_LANGUAGE as Language)
                : undefined;
        Utility.defaultIdlePrefix =
            env.DEFAULT_CHOICE_IDLE_PREFIX && env.DEFAULT_CHOICE_IDLE_PREFIX.length > 0
                ? env.DEFAULT_CHOICE_IDLE_PREFIX
                : undefined;
        Utility.defaultIdleColor =
            env.DEFAULT_CHOICE_IDLE_COLOR && env.DEFAULT_CHOICE_IDLE_COLOR.length > 0
                ? (env.DEFAULT_CHOICE_IDLE_COLOR as ColorName)
                : undefined;
        Utility.defaultHoverPrefix =
            env.DEFAULT_CHOICE_HOVER_PREFIX && env.DEFAULT_CHOICE_HOVER_PREFIX.length > 0
                ? env.DEFAULT_CHOICE_HOVER_PREFIX
                : undefined;
        Utility.defaultHoverColor =
            env.DEFAULT_CHOICE_HOVER_COLOR && env.DEFAULT_CHOICE_HOVER_COLOR.length > 0
                ? (env.DEFAULT_CHOICE_HOVER_COLOR as ColorName)
                : undefined;
        Utility.defaultSelectedPrefix =
            env.DEFAULT_CHOICE_SELECTED_PREFIX && env.DEFAULT_CHOICE_SELECTED_PREFIX.length > 0
                ? env.DEFAULT_CHOICE_SELECTED_PREFIX
                : undefined;
        Utility.defaultSelectedColor =
            env.DEFAULT_CHOICE_SELECTED_COLOR && env.DEFAULT_CHOICE_SELECTED_COLOR.length > 0
                ? (env.DEFAULT_CHOICE_SELECTED_COLOR as ColorName)
                : undefined;
        Utility.defaultIdleUnderline =
            env.DEFAULT_CHOICE_IDLE_UNDERLINE && env.DEFAULT_CHOICE_IDLE_UNDERLINE.length > 0
                ? env.DEFAULT_CHOICE_IDLE_UNDERLINE === "true"
                : undefined;
        Utility.defaultHoverUnderline =
            env.DEFAULT_CHOICE_HOVER_UNDERLINE && env.DEFAULT_CHOICE_HOVER_UNDERLINE.length > 0
                ? env.DEFAULT_CHOICE_HOVER_UNDERLINE === "true"
                : undefined;
        Utility.defaultSelectedUnderline =
            env.DEFAULT_CHOICE_SELECTED_UNDERLINE && 
            env.DEFAULT_CHOICE_SELECTED_UNDERLINE.length > 0
                ? env.DEFAULT_CHOICE_SELECTED_UNDERLINE === "true"
                : undefined;
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