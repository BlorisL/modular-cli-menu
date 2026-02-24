import { inputPrompt } from "@/prompts/Input";
import { appendFileSync } from "fs";
import { Menu, MenuJson } from "../menu";
import { Translations } from "../../translations";

type MenuInputJson = MenuJson & {
    type: 'input';
    value?: string;
    placeholder?: string;
    clear?: boolean;
    validate?: (value: string) => boolean | string;
    callback?: (data: { menu: MenuInput; value: string }) => Promise<void>;
};

class MenuInput extends Menu {
    protected type: MenuInputJson['type'] = 'input';
    protected value: string;
    protected placeholder?: MenuInputJson['placeholder'];
    protected clear: MenuInputJson['clear'];
    protected validate?: MenuInputJson['validate'];
    protected callback?: MenuInputJson['callback'];

    constructor(data: MenuInputJson) {
        super(data);
        this.value       = data.value ?? '';
        this.placeholder = data.placeholder;
        this.clear = data.clear === undefined ? true : data.clear;
        this.validate    = data.validate;
        this.callback    = data.callback;
    }

    public getValue(): string { return this.value; }
    public setValue(value: string): this { this.value = value; return this; }

    public getPlaceholder(): MenuInput['placeholder'] { return this.placeholder; }
    public setPlaceholder(placeholder: MenuInput['placeholder']): this { this.placeholder = placeholder; return this; }

    public getValidate(): MenuInput['validate'] { return this.validate; }
    public setValidate(validate: MenuInput['validate']): this { this.validate = validate; return this; }

    public getCallback(): MenuInput['callback'] { return this.callback; }
    public setCallback(callback: MenuInput['callback']): this { this.callback = callback; return this; }

    public setClear(clear: boolean): this { this.clear = clear; return this; }
    public isClear(): boolean { return this.clear === true; }

    public getPlaceholderName(): string {
        return `${this.getPlugin() ?? 'default'}.${this.getName()}.placeholder`;
    }

    public getPlaceholderLabel(language?: any): string {
        const name = this.getPlaceholderName();
        const all = Translations.getTranslations();
        if (all[name]) {
            return Translations.getTranslation(name, language);
        }
        return this.placeholder ?? '';
    }

    public toJson(): MenuInputJson {
        return {
            ...super.toJson(),
            type:        this.type,
            value:       this.value || undefined,
            placeholder: this.placeholder,
            clear: this.clear,
        };
    }

    public async run(): Promise<string> {
        if (this.isClear()) {
            console.clear();
        }

        const answer = await inputPrompt({
            message:     this.getQuestionLabel(),
            value:       this.value || undefined,
            placeholder: this.getPlaceholderLabel(),
            validate:    this.validate,
        });

        this.value = answer;

        // Log rendered menu (same pattern as MenuChoice)
        try {
            const logPath = `${process.cwd()}/menu.log`;
            const header  = `${new Date().toISOString()} ${this.getName()} - ${this.getQuestionLabel()}\n`;
            appendFileSync(logPath, header + answer + '\n\n');
        } catch {
            // don't break execution on logging errors
        }

        if (this.callback) {
            await this.callback({ menu: this, value: answer });
        }

        return answer;
    }
}

export { type MenuInputJson, MenuInput };