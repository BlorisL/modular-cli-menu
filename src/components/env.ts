import { config } from "dotenv";
import { ColorName } from "chalk";
import { Language } from "@/components/translations";

class Env {
    protected debugLog!: boolean;
    protected language!: Language;

    // Choice defaults
    protected idlePrefix!: string;
    protected idleColor?: ColorName;
    protected hoverPrefix!: string;
    protected hoverColor?: ColorName;
    protected selectedPrefix!: string;
    protected selectedColor?: ColorName;
    protected idleUnderline!: boolean;
    protected hoverUnderline!: boolean;
    protected selectedUnderline!: boolean;

    constructor() {
        this.load();
    }

    // Static defaults
    protected static defaultDebugLog: boolean = false;
    protected static defaultLanguage: Language = "en";
    protected static defaultIdlePrefix: string = " ";
    protected static defaultIdleColor: ColorName | undefined = undefined;
    protected static defaultHoverPrefix: string = "❯";
    protected static defaultHoverColor: ColorName | undefined = undefined;
    protected static defaultSelectedPrefix: string = "";
    protected static defaultSelectedColor: ColorName | undefined = undefined;
    protected static defaultIdleUnderline: boolean = false;
    protected static defaultHoverUnderline: boolean = false;
    protected static defaultSelectedUnderline: boolean = false;

    protected envString(value?: string): string | undefined {
        return value && value.length > 0 ? value : undefined;
    }

    protected envBool(value?: string | boolean): boolean | undefined {
        let result: boolean | undefined;
        switch (value) {
            case true:
            case "true":
                result = true;
                break;
            case false:
            case "false":
                result = false;
                break;
            default:
                result = undefined;
                break;
        }

        return result;
    }

    public load(): this {
        config({ path: ".env" });

        const env = process.env;
        this.setDebugLog(env.DEBUG_LOG);
        this.setLanguage(env.DEFAULT_LANGUAGE);
        this.setIdlePrefix(env.DEFAULT_CHOICE_IDLE_PREFIX);
        this.setIdleColor(env.DEFAULT_CHOICE_IDLE_COLOR);
        this.setHoverPrefix(env.DEFAULT_CHOICE_HOVER_PREFIX);
        this.setHoverColor(env.DEFAULT_CHOICE_HOVER_COLOR);
        this.setSelectedPrefix(env.DEFAULT_CHOICE_SELECTED_PREFIX);
        this.setSelectedColor(env.DEFAULT_CHOICE_SELECTED_COLOR);
        this.setIdleUnderline(env.DEFAULT_CHOICE_IDLE_UNDERLINE);
        this.setHoverUnderline(env.DEFAULT_CHOICE_HOVER_UNDERLINE);
        this.setSelectedUnderline(env.DEFAULT_CHOICE_SELECTED_UNDERLINE);

        return this;
    }

    public getDebugLog(): Env["debugLog"] {
        return this.debugLog;
    }

    public setDebugLog(value?: Env["debugLog"] | string): this {
        const debugLog = this.envBool(value);
        this.debugLog = debugLog !== undefined ? debugLog : Env.defaultDebugLog;
        return this;
    }

    public isDebugLog(): boolean {
        return this.debugLog === true;
    }

    public getLanguage(): Env["language"] {
        return this.language;
    }

    public setLanguage(value?: Env["language"] | string): this {
        const language = this.envString(value) as Env["language"] | undefined;
        this.language = language ?? Env.defaultLanguage;
        return this;
    }

    public getIdlePrefix(): Env["idlePrefix"] {
        return this.idlePrefix;
    }

    public setIdlePrefix(value?: Env["idlePrefix"]): this {
        this.idlePrefix = this.envString(value) ?? Env.defaultIdlePrefix;
        return this;
    }

    public getIdleColor(): Env["idleColor"] {
        return this.idleColor;
    }

    public setIdleColor(value?: Env["idleColor"] | string): this {
        const color = this.envString(value) as Env["idleColor"];
        this.idleColor = color ?? Env.defaultIdleColor;
        return this;
    }

    public getHoverPrefix(): Env["hoverPrefix"] {
        return this.hoverPrefix;
    }

    public setHoverPrefix(value?: Env["hoverPrefix"]): this {
        this.hoverPrefix = this.envString(value) ?? Env.defaultHoverPrefix;
        return this;
    }

    public getHoverColor(): Env["hoverColor"] {
        return this.hoverColor;
    }

    public setHoverColor(value?: Env["hoverColor"] | string): this {
        const color = this.envString(value) as Env["hoverColor"];
        this.hoverColor = color ?? Env.defaultHoverColor;
        return this;
    }

    public getSelectedPrefix(): Env["selectedPrefix"] {
        return this.selectedPrefix;
    }

    public setSelectedPrefix(value?: Env["selectedPrefix"]): this {
        this.selectedPrefix = this.envString(value) ?? Env.defaultSelectedPrefix;
        return this;
    }

    public getSelectedColor(): Env["selectedColor"] {
        return this.selectedColor;
    }

    public setSelectedColor(value?: Env["selectedColor"] | string): this {
        const color = this.envString(value) as Env["selectedColor"];
        this.selectedColor = color ?? Env.defaultSelectedColor;
        return this;
    }

    public getIdleUnderline(): Env["idleUnderline"] {
        return this.idleUnderline;
    }

    public setIdleUnderline(value?: Env["idleUnderline"] | string): this {
        const underline = this.envBool(value);
        this.idleUnderline = underline !== undefined ? underline : Env.defaultIdleUnderline;
        return this;
    }

    public isIdleUnderline(): boolean {
        return this.idleUnderline === true;
    }

    public getHoverUnderline(): Env["hoverUnderline"] {
        return this.hoverUnderline;
    }

    public setHoverUnderline(value?: Env["hoverUnderline"] | string): this {
        const underline = this.envBool(value);
        this.hoverUnderline = underline !== undefined ? underline : Env.defaultHoverUnderline;
        return this;
    }

    public isHoverUnderline(): boolean {
        return this.hoverUnderline === true;
    }

    public getSelectedUnderline(): Env["selectedUnderline"] {
        return this.selectedUnderline;
    }

    public setSelectedUnderline(value?: Env["selectedUnderline"] | string): this {
        const underline = this.envBool(value);
        this.selectedUnderline = underline !== undefined ? underline : Env.defaultSelectedUnderline;
        return this;
    }

    public isSelectedUnderline(): boolean {
        return this.selectedUnderline === true;
    }
}

export { Env };
