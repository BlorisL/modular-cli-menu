import chalk, { ColorName } from "chalk";
import { appendFileSync, mkdirSync } from "fs";
import { Env } from "@/components/env";

class Utility {
    protected static env: Env = new Env();
    protected static debugLogPath: string = "";

    static {
        if (this.env.isDebugLog()) {
            try {
                const logsDir = `${process.cwd()}/logs`;

                mkdirSync(logsDir, { recursive: true });

                const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
                Utility.debugLogPath = `${logsDir}/log-${timestamp}.log`;
            } catch (err) {
                console.log(1, err);
            }
        }
    }

    /** Returns true if debug file logging is currently active. */
    public static isDebugLog(): boolean {
        return Utility.debugLogPath.length > 0;
    }

    /**
     * Appends a line to the debug log file, stripping ANSI escape codes.
     * @param value Text to log.
     * @param force Write even when debug logging is disabled.
     */
    public static log(value: string, force: boolean = false): void {
        if (Utility.isDebugLog() || force) {
            try {
                const cleanValue = value.replace(/\x1b\[[0-9;]*m/g, "");
                appendFileSync(Utility.debugLogPath, cleanValue + "\n");
            } catch (err) {
                console.log(2, err);
            }
        }
    }

    /** Returns the shared Env instance holding all resolved environment defaults. */
    public static getEnv(): Env {
        return Utility.env;
    }

    /**
     * Wraps text with a chalk color if the color is valid.
     * Returns the plain text when no color is given, or an empty string when text is undefined.
     * @param text Text to style.
     * @param color Optional chalk color name.
     */
    public static write(text?: string, color?: ColorName): string {
        return text ? (color && chalk[color] ? chalk[color](text) : text) : "";
    }
}

export { Utility };
