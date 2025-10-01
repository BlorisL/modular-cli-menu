import { Choice, choices } from "@/prompts/Choices";
import { Menu, MenuConfig, MenuOptions, ModeType } from "./menu";
import { Action } from "../action";
import { Separator } from '@inquirer/core';

type MenuChoicesOptions = MenuOptions & {
    getGlobalActions?: () => Action[];
    findMenu?: (name: string) => Menu | undefined;
    findAction?: (name: string) => Action | undefined;
    options?: Omit<Parameters<typeof choices>[0], 'message' | 'choices'>;
}

type MenuChoiceConfig = {
    name: string;
    value: string;
    isMulti?: boolean;
}

type MenuChoicesConfig = MenuConfig & {
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
        const { values, ...menuConfig } = config;
        super(menuConfig);
        this.set(values);
    }

    public getMode(): ModeType { return this.mode; }

    public getValues(): MenuChoice[] { return this.values; }
    public set(values: Array<string | MenuChoiceConfig>): this {
        this.values = values.map(value => {
            if (typeof value === 'string') {
                return new MenuChoice({ name: value, value, isMulti: false });
            } else {
                return new MenuChoice(value);
            }
        });
        return this;
    }

    public add(choice: string | MenuChoiceConfig): this {
        if (typeof choice === 'string') {
            this.values.push(new MenuChoice({ name: choice, value: choice, isMulti: false }));
        } else {
            this.values.push(new MenuChoice(choice));
        }
        return this;
    }

    public async print(params: MenuChoicesOptions = {}) {
        const globalActions = [
            new Separator(),
            ...(params.getGlobalActions?.() ?? []).map(action => ({ name: action.getName(), value: action.getName(), isMulti: false }))
        ];
        const answers = await choices({
            ...(params.options ?? {}),
            message: this.getName(),
            choices: [
                ...this.getValues().map(choice => choice.toObject()),
                ...(globalActions.length > 1 ? globalActions : [])
            ],
        }) as string[];

        answers.forEach(answer => {
        console.log(answers)
            params.findAction?.(answer)?.run({ 
                findMenu: params.findMenu,
                findAction: params.findAction,
                selected: answers 
            });
        });
    }
}

export {
    MenuChoice,
    MenuChoices,
    type MenuChoiceConfig,
    type MenuChoicesConfig
};