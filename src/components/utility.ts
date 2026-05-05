import chalk, { ColorName } from "chalk";
// import { MenuInput } from "@/components/menus";
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

    public static isDebugLog(): boolean {
        return Utility.debugLogPath.length > 0;
    }

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

    public static getEnv(): Env {
        return Utility.env;
    }

    public static write(text?: string, color?: ColorName): string {
        return text ? (color && chalk[color] ? chalk[color](text) : text) : "";
    }
}

export { Utility };
