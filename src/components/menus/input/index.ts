import input from "@inquirer/input";
import { appendFileSync } from "fs";
import { Menu, MenuJson } from "../menu";

type MenuInputJson = MenuJson & {
    type: 'input';
    placeholder?: string;
    validate?: (value: string) => boolean | string;
    callback?: (data: { menu: MenuInput; value: string }) => Promise<void>;
};

class MenuInput extends Menu {
    protected type: MenuInputJson['type'] = 'input';
    protected placeholder?: MenuInputJson['placeholder'];
    protected validate?: MenuInputJson['validate'];
    protected callback?: MenuInputJson['callback'];
    protected lastValue: string = '';

    constructor(data: MenuInputJson) {
        super(data);
        this.placeholder = data.placeholder;
        this.validate    = data.validate;
        this.callback    = data.callback;
    }

    public getPlaceholder(): MenuInput['placeholder'] { return this.placeholder; }
    public setPlaceholder(placeholder: MenuInput['placeholder']): this { this.placeholder = placeholder; return this; }

    public getValidate(): MenuInput['validate'] { return this.validate; }
    public setValidate(validate: MenuInput['validate']): this { this.validate = validate; return this; }

    public getCallback(): MenuInput['callback'] { return this.callback; }
    public setCallback(callback: MenuInput['callback']): this { this.callback = callback; return this; }

    public getLastValue(): string { return this.lastValue; }

    public toJson(): MenuInputJson {
        return {
            ...super.toJson(),
            type:        this.type,
            placeholder: this.placeholder,
        };
    }

    public async run(): Promise<string> {
        console.clear();

        const answer = await input({
            message:     this.getQuestionLabel(),
            default:     this.placeholder,
            validate:    this.validate,
        });

        this.lastValue = answer;

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