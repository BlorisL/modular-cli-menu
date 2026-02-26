import { input, inputInline } from "@/prompts/Input";
import { Choice, Separator } from "@/prompts/Choices";
import { appendFileSync } from "fs";
import { Menu, MenuJson } from "../menu";
import { Language, Translations } from "../../translations";
import { inputChoice } from "../input-choice";

type MenuInputJson = MenuJson & {
    type: 'input';
    value?: string;
    placeholder?: string;
    clear?: boolean;
    fastSubmit?: boolean;
    /**
     * When true, a fastSubmit prompt renders inline ("message ▌") on a single
     * line with no "?" prefix and no trailing blank line after the keypress.
     * Ideal for "Press any key to continue" style prompts.
     * Defaults to false.
     */
    inline?: boolean;
    validate?: (value: string) => boolean | string;
    callback?: (data: { menu: MenuInput; value: string, language?: Language, parent?: string }) => Promise<void>;
};

class MenuInput extends Menu {
    protected type: MenuInputJson['type'] = 'input';
    protected value: NonNullable<MenuInputJson['value']>;
    protected placeholder: NonNullable<MenuInputJson['placeholder']>;
    protected clear: NonNullable<MenuInputJson['clear']>;
    protected fastSubmit?: NonNullable<MenuInputJson['fastSubmit']>;
    protected inline: boolean;
    protected validate?: MenuInputJson['validate'];
    protected callback?: MenuInputJson['callback'];
    protected globalChoices: (Choice | Separator)[] = [];
    protected lastParent: string | undefined = undefined;

    constructor(data: MenuInputJson) {
        super(data);
        this.value = data.value ?? '';
        this.placeholder = data.placeholder ?? '';
        this.clear = data.clear === undefined ? true : data.clear;
        this.fastSubmit = data.fastSubmit ?? false;
        this.inline = data.inline ?? false;
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

    public getGlobalChoices(): (Choice | Separator)[] { return this.globalChoices; }
    public setGlobalChoices(choices: (Choice | Separator)[]): this { this.globalChoices = choices; return this; }

    public getLastParent(): string | undefined { return this.lastParent; }
    public setLastParent(parent: string): this { this.lastParent = parent; return this; }

    public setClear(clear: boolean): this { this.clear = clear; return this; }
    public isClear(): boolean { return this.clear === true; }

    public setFastSubmit(value: boolean): this { this.fastSubmit = value; return this; }
    public isFastSubmit(): boolean { return this.fastSubmit === true; }

    public setInline(value: boolean): this { this.inline = value; return this; }
    public isInline(): boolean { return this.inline; }

    public getPlaceholderName(): string {
        return `${this.getPlugin() ?? 'default'}.${this.getName()}.placeholder`;
    }

    public getPlaceholderLabel(language?: Language): string {
        const name = this.getPlaceholder().length > 0
            ? this.getPlaceholder()
            : this.getPlaceholderName();
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
            inline: this.inline,
        };
    }

    public async run(): Promise<string> {
        if(this.isClear()) {
            console.clear();
        }

        // inline + fastSubmit → single-line keypress, no trailing blank line
        if(this.isFastSubmit() && this.isInline()) {
            const key = await inputInline({
                message: this.getQuestionLabel(),
                fastSubmit: true,
                inline: true,
            });
            this.value = key;
            return key;
        }

        // fastSubmit without inline → standard prompt, but skip choices list
        // (showing back/language/exit while just waiting for any key is confusing)
        if(this.isFastSubmit()) {
            const answer = await input({
                message: this.getQuestionLabel(),
                fastSubmit: true,
            });
            this.value = answer;
            return answer;
        }

        // Normal input — show global choices if present
        let answer: string;

        if(this.globalChoices.length > 0) {
            const result = await inputChoice({
                message: this.getQuestionLabel(),
                value: this.getValue(),
                placeholder: this.getPlaceholderLabel(),
                validate: this.validate,
                fastSubmit: false,
                choices: this.globalChoices,
            });
            if(result.type === 'choice') {
                return result.value;
            }
            answer = result.value;
        } else {
            answer = await input({
                message: this.getQuestionLabel(),
                value: this.getValue(),
                placeholder: this.getPlaceholderLabel(),
                validate: this.validate,
                fastSubmit: false,
            });
        }

        this.value = answer;

        try {
            const logPath = `${process.cwd()}/menu.log`;
            const header  = `${new Date().toISOString()} ${this.getName()} - ${this.getQuestionLabel()}\n`;
            appendFileSync(logPath, header + answer + '\n\n');
        } catch {
            // don't break on logging errors
        }

        return answer;
    }
}

export { type MenuInputJson, MenuInput };