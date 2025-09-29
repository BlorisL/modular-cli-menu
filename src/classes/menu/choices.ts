import { Choice, choices } from "@/prompts/Choices";
import { Menu, MenuConfig, ModeType } from ".";

type MenuChoicesOptions = Omit<Parameters<typeof choices>[0], 'message' | 'choices'>;

type MenuChoiceConfig = {
    name: string;
    value: string;
    isMulti?: boolean;
}

type MenuChoicesConfig = MenuConfig &{
    name: string;
    values: Array<string | MenuChoiceConfig>;
}

class MenuChoice {
    protected name: string;
    protected value: string;
    protected isMulti: boolean;

    public constructor(config: MenuChoiceConfig) {
        this.name = config.name;
        this.value = config.value;
        this.isMulti = config.isMulti ?? false;
    }

    public getName(): string { return this.name; }
    public getValue(): string { return this.value; }
    public getIsMulti(): boolean { return this.isMulti; }

    public toObject(): Choice {
        return { name: this.name, value: this.value, isMulti: this.isMulti };
    }
}

class MenuChoices extends Menu {
    static readonly MODE_NAME = 'choices';
    protected mode: ModeType = MenuChoices.MODE_NAME;
    protected values: MenuChoice[] = [];

    public constructor(config: MenuChoicesConfig) {
        super({ mode: MenuChoices.MODE_NAME, name: config.name });
        this.setValues(config.values);
    }

    public getMode(): ModeType { return this.mode; }

    public getValues(): MenuChoice[] { return this.values; }
    public setValues(values: Array<string | MenuChoiceConfig>): this {
        this.values = values.map(value => {
            if (typeof value === 'string') {
                return new MenuChoice({ name: value, value, isMulti: false });
            } else {
                return new MenuChoice(value);
            }
        });
        return this;
    }

    public async print(options: MenuChoicesOptions = {}) {
        const answers = await choices({
            ...options,
            message: this.getName(),
            choices: this.getValues().map(choice => choice.toObject()),
        }) as string[];

        console.log('Selected values:', answers);
    }
}

export {
    MenuChoice,
    MenuChoices,
    type MenuChoiceConfig,
    type MenuChoicesConfig
};