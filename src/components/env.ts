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
    protected pageSize!: number;

    /**
     * Creates a new Env instance and immediately loads settings from .env file.
     * All defaults are hardcoded static values; consumer .env overrides apply at runtime.
     */
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
    protected static defaultPageSize: number = 10;

    /** Helper: extracts a string from env, returning undefined if empty. */
    protected envString(value?: string): string | undefined {
        return value && value.length > 0 ? value : undefined;
    }

    /** Helper: converts a string or boolean to a boolean, handling "true"/"false" strings. */
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

    /** Reloads settings from the .env file and re-applies all values. @returns this for chaining. */
    public load(): this {
        config({ path: ".env", quiet: true });

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
        this.setPageSize(env.DEFAULT_CHOICE_PAGE_SIZE);

        return this;
    }

    /** Returns the raw debug log flag. */
    public getDebugLog(): Env["debugLog"] {
        return this.debugLog;
    }

    /**
     * Sets the debug log flag from a boolean or env string.
     * @param value Boolean or "true"/"false" string. Falls back to the class default if omitted.
     */
    public setDebugLog(value?: Env["debugLog"] | string): this {
        const debugLog = this.envBool(value);
        this.debugLog = debugLog !== undefined ? debugLog : Env.defaultDebugLog;
        return this;
    }

    /** Returns true when debug file logging is active. */
    public isDebugLog(): boolean {
        return this.debugLog === true;
    }

    /** Returns the current default language code. */
    public getLanguage(): Env["language"] {
        return this.language;
    }

    /**
     * Sets the default language. Falls back to the class default if value is empty.
     * @param value Language code string.
     */
    public setLanguage(value?: Env["language"] | string): this {
        const language = this.envString(value) as Env["language"] | undefined;
        this.language = language ?? Env.defaultLanguage;
        return this;
    }

    /** Returns the idle state prefix string. */
    public getIdlePrefix(): Env["idlePrefix"] {
        return this.idlePrefix;
    }

    /** Sets the idle state prefix. Falls back to the default if empty. */
    public setIdlePrefix(value?: Env["idlePrefix"]): this {
        this.idlePrefix = this.envString(value) ?? Env.defaultIdlePrefix;
        return this;
    }

    /** Returns the idle state color, or undefined to use the terminal default. */
    public getIdleColor(): Env["idleColor"] {
        return this.idleColor;
    }

    /** Sets the idle state color. Pass undefined or empty to use the terminal default. */
    public setIdleColor(value?: Env["idleColor"] | string): this {
        const color = this.envString(value) as Env["idleColor"];
        this.idleColor = color ?? Env.defaultIdleColor;
        return this;
    }

    /** Returns the hover state prefix string. */
    public getHoverPrefix(): Env["hoverPrefix"] {
        return this.hoverPrefix;
    }

    /** Sets the hover state prefix. Falls back to the default if empty. */
    public setHoverPrefix(value?: Env["hoverPrefix"]): this {
        this.hoverPrefix = this.envString(value) ?? Env.defaultHoverPrefix;
        return this;
    }

    /** Returns the hover state color, or undefined to use the terminal default. */
    public getHoverColor(): Env["hoverColor"] {
        return this.hoverColor;
    }

    /** Sets the hover state color. Pass undefined or empty to use the terminal default. */
    public setHoverColor(value?: Env["hoverColor"] | string): this {
        const color = this.envString(value) as Env["hoverColor"];
        this.hoverColor = color ?? Env.defaultHoverColor;
        return this;
    }

    /** Returns the selected state prefix string. */
    public getSelectedPrefix(): Env["selectedPrefix"] {
        return this.selectedPrefix;
    }

    /** Sets the selected state prefix. Falls back to the default if empty. */
    public setSelectedPrefix(value?: Env["selectedPrefix"]): this {
        this.selectedPrefix = this.envString(value) ?? Env.defaultSelectedPrefix;
        return this;
    }

    /** Returns the selected state color, or undefined to use the terminal default. */
    public getSelectedColor(): Env["selectedColor"] {
        return this.selectedColor;
    }

    /** Sets the selected state color. Pass undefined or empty to use the terminal default. */
    public setSelectedColor(value?: Env["selectedColor"] | string): this {
        const color = this.envString(value) as Env["selectedColor"];
        this.selectedColor = color ?? Env.defaultSelectedColor;
        return this;
    }

    /** Returns whether the idle state applies underline decoration. */
    public getIdleUnderline(): Env["idleUnderline"] {
        return this.idleUnderline;
    }

    /** Sets the idle underline flag. Accepts a boolean or "true"/"false" string. */
    public setIdleUnderline(value?: Env["idleUnderline"] | string): this {
        const underline = this.envBool(value);
        this.idleUnderline = underline !== undefined ? underline : Env.defaultIdleUnderline;
        return this;
    }

    /** Returns true if idle underline decoration is active. */
    public isIdleUnderline(): boolean {
        return this.idleUnderline === true;
    }

    /** Returns whether the hover state applies underline decoration. */
    public getHoverUnderline(): Env["hoverUnderline"] {
        return this.hoverUnderline;
    }

    /** Sets the hover underline flag. Accepts a boolean or "true"/"false" string. */
    public setHoverUnderline(value?: Env["hoverUnderline"] | string): this {
        const underline = this.envBool(value);
        this.hoverUnderline = underline !== undefined ? underline : Env.defaultHoverUnderline;
        return this;
    }

    /** Returns true if hover underline decoration is active. */
    public isHoverUnderline(): boolean {
        return this.hoverUnderline === true;
    }

    /** Returns whether the selected state applies underline decoration. */
    public getSelectedUnderline(): Env["selectedUnderline"] {
        return this.selectedUnderline;
    }

    /** Sets the selected underline flag. Accepts a boolean or "true"/"false" string. */
    public setSelectedUnderline(value?: Env["selectedUnderline"] | string): this {
        const underline = this.envBool(value);
        this.selectedUnderline = underline !== undefined ? underline : Env.defaultSelectedUnderline;
        return this;
    }

    /** Returns true if selected underline decoration is active. */
    public isSelectedUnderline(): boolean {
        return this.selectedUnderline === true;
    }

    /** Returns the default page size for scrollable choice menus. */
    public getPageSize(): number {
        return this.pageSize;
    }

    /**
     * Sets the default page size from a number or env string.
     * Falls back to the class default (10) if the value is missing or invalid.
     * @param value Number or numeric string.
     */
    public setPageSize(value?: number | string): this {
        const parsed = typeof value === "number" ? value : parseInt(value ?? "", 10);
        this.pageSize = !isNaN(parsed) && parsed > 0 ? parsed : Env.defaultPageSize;
        return this;
    }
}

export { Env };
