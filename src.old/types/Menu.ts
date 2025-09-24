import { ColorName } from "chalk";
import input from '@inquirer/input';
import select from '@inquirer/select';
import { Menu } from "@/classes/Menu";
import { choices } from "@/prompts/Choices";

export type MenusType = Record<string, Menu>;
export type MenuMode = 'input' | 'choice';

export type ActionChoiceType = string | { value: string, isMulti?: boolean };

export type InputType = Omit<Parameters<typeof input>[0], 'message'>;
export type MenuInputType = {
    mode: 'input';
};

export type ChoiceType = Omit<Parameters<typeof choices>[0], 'message' | 'choices'>;
export type MenuChoiceType = {
    mode: 'choice';
    actions: ActionChoiceType[] | (() => ActionChoiceType[]);
};

export type MenuType = {
    index?: number;
    name: string;
    parent?: string;
    message?: string;
    color?: ColorName;
} & ( MenuInputType | MenuChoiceType );