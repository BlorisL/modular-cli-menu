import { Action, Actions } from "@/classes/Action";
import { Menus } from "@/classes/Menu";
import { ColorName } from "chalk";

export type ActionsType = Record<string, Action>;
export type ActionMode = 'function' | 'goto';

export type ActionFunctionType = {
    mode: 'function';
    options?: {
        callback?: (args: { menus: Menus; actions: Actions; action: Action }) => Promise<unknown>;
    };
};

export type ActionGoToType = {
    mode: 'goto';
    options?: {
        to?: string;
    };
};

export type ActionType = {
    name: string;
    index?: number;
    message?: string;
    color?: ColorName;
} & ( ActionFunctionType | ActionGoToType );