import { input } from "@/prompts/Input";
import { appendFileSync } from "fs";
import { Menu, MenuJson } from "../menu";
import { Language, Translations } from "../../translations";

type MenuInputJson = MenuJson & {
    type: 'input';
    value?: string;
    placeholder?: string;
    clear?: boolean;
    fastSubmit?: boolean;
    validate?: (value: string) => boolean | string;
    callback?: (data: { menu: MenuInput; value: string, language?: Language }) => Promise<void>;
};

class MenuInput extends Menu {
    protected type: MenuInputJson['type'] = 'input';
    protected value: NonNullable<MenuInputJson['value']>;
    protected placeholder: NonNullable<MenuInputJson['placeholder']>;
    protected clear: NonNullable<MenuInputJson['clear']>;
    protected fastSubmit?: NonNullable<MenuInputJson['fastSubmit']>;
    protected validate?: MenuInputJson['validate'];
    protected callback?: MenuInputJson['callback'];

    constructor(data: MenuInputJson) {
        super(data);
        this.value = data.value ?? '';
        this.placeholder = data.placeholder ?? '';
        this.clear = data.clear === undefined ? true : data.clear;
        this.fastSubmit = data.fastSubmit ?? false;
        this.validate = data.validate;
        this.callback = data.callback;
    }

    public getValue(): string { return this.value; }
    public setValue(value: string): this { this.value = value; return this; }

    public getPlaceholder(): MenuInput['placeholder'] { return this.placeholder; }
    public setPlaceholder(placeholder: NonNullable<MenuInput['placeholder']>): this { 
        this.placeholder = placeholder; 
        return this; 
    }

    public getValidate(): MenuInput['validate'] { return this.validate; }
    public setValidate(validate: MenuInput['validate']): this { this.validate = validate; return this; }

    public getCallback(): MenuInput['callback'] { return this.callback; }
    public setCallback(callback: MenuInput['callback']): this { this.callback = callback; return this; }

    public setClear(clear: boolean): this { this.clear = clear; return this; }
    public isClear(): boolean { return this.clear === true; }

    public setFastSubmit(value: boolean): this { this.fastSubmit = value; return this; }
    public isFastSubmit(): boolean { return this.fastSubmit === true; }

    public getPlaceholderName(): string {
        return `${this.getPlugin() ?? 'default'}.${this.getName()}.placeholder`;
    }

    public getPlaceholderLabel(language?: Language): string {
        const name = this.getPlaceholder().length > 0 
            ? this.getPlaceholder() 
            : this.getPlaceholderName()
        ;

        return Translations.getTranslation(name, language) ?? name;
    }

    public toJson(): Omit<MenuInputJson, 'value' | 'placeholder' | 'clear'> & { 
        value: string; 
        placeholder: string; 
        clear: boolean;
    } {
        return {
            ...super.toJson(),
            type: this.type,
            value: this.value,
            placeholder: this.placeholder,
            clear: this.clear,
            fastSubmit: this.fastSubmit ?? false,
        };
    }

    public async run(): Promise<string> {
        if (this.isClear()) {
            console.clear();
        }

        const answer = await input({
            message: this.getQuestionLabel(),
            value: this.getValue(),
            placeholder: this.getPlaceholderLabel(),
            validate: this.validate,
            fastSubmit: this.fastSubmit ?? false,
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

        //if (this.callback) {
        //    await this.callback({ menu: this, value: answer });
        //}

        return answer;
    }
}

export { type MenuInputJson, MenuInput };