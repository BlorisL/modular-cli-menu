import { Choice, choices } from "@/prompts/Choices";
import { Menu, MenuConfig, MenuOptions, ModeType } from "./menu";
import { Separator } from '@inquirer/core';
import { tmpdir } from "os";

type MenuChoicesOptions = MenuOptions & {
    options?: Omit<Parameters<typeof choices>[0], 'message' | 'choices'>;
}

type MenuChoiceConfig = {
    name: string;
    value: string;
    isMulti?: boolean;
}

type MenuChoicesConfig = MenuConfig & {
    mode: 'choices';
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
        // values may be undefined when cloning from a base MenuConfig
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

    public override async print(params?: MenuChoicesOptions) {
        const menu = await (super.print(params) as Promise<this>);

        const globalActions = [
            new Separator(),
            ...(params?.getGlobalActions?.() ?? []).map(action => ({ name: action.getName(), value: action.getName(), isMulti: false }))
        ];
        setTimeout(() => {
            console.log('')
            console.log('### MENU')
            console.log(menu)
        }, 1000);
        const answers = await choices({
            ...(params?.options ?? {}),
            message: menu.getName(),
            choices: [
                ...menu.getValues().map(choice => {
                    const tmp = choice.toObject();
                    const action = params?.findAction(tmp.name);
                    tmp.name += ' | from: ' + (action?.getFrom() ? action?.getFrom()?.getName() : 'no from found');
                    return tmp;
                }),
                ...(globalActions.length > 1 ? globalActions : []).map(a => {
                    const tmp = a;
                    if(!(tmp instanceof Separator)) {
                        tmp.name += ' | from: ' + (menu.getFrom() ? menu.getFrom()?.getName() : 'no from found');
                    }
                    return tmp;
                })
            ],
        }) as string[];

        if(params) {
            answers.forEach(answer => {
                console.log(answers)
                const action = params?.findAction?.(answer);
                action?.run({
                    from: action.getFrom() ?? menu.getFrom(),
                    findMenu: params.findMenu,
                    findAction: params.findAction,
                    getGlobalActions: params.getGlobalActions
                });
            });
        }
    }

    public toObject(): MenuChoicesConfig {
        return {
            ...super.toObject(),
            mode: MenuChoices.MODE_NAME,
            name: this.getName(),
            values: this.getValues().map(v => ({ name: v.getName(), value: v.getValue(), isMulti: v.getIsMulti() })),
        };
    }
}

export {
    MenuChoice,
    MenuChoices,
    type MenuChoiceConfig,
    type MenuChoicesConfig
};