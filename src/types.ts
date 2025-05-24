import { ColorName } from "chalk";

type ActionDefaultType = {
  name: string;
  color?: ColorName;
}

type ActionFunctionType = {
    type: 'function';
    options?: {
        message?: {
            color?: ColorName;
            text: string;
        };
        callback?: (parent?: string) => Promise<void>;
    };
}

type ActionGoToType = {
    type: 'goto';
    options?: {
        callback?: (to: string) => Promise<void>;
    };
}

type ActionInputType = {
    type: 'input';
    options?: {
        message?: {
            color?: ColorName;
            text: string;
        };
        default?: string;
        callback?: (value: string, parent?: string) => Promise<void>;
    };
}

type ActionCheckBoxType = {
    type: 'checkbox';
    options?: {
        message?: {
            color?: ColorName;
            text: string;
        };
        answers: Array<{ name: string, value: string, color?: ColorName }>;
        callback?: (value: string[], parent?: string) => Promise<void>;
    };
}

type ActionType = ActionDefaultType & (
    ActionFunctionType | 
    ActionInputType |
    ActionCheckBoxType |
    ActionGoToType
);

type ActionsType = Record<string, ActionType>;

type MenuItemType = {
    name: string;
    color?: ColorName;
    parent?: string;
    choices: string[];
}

type MenuType = Record<string, MenuItemType>;

type PluginType = {
    menu: MenuItemType;
    actions: ActionsType;
    languages?: Record<string, any>;
}

export {
    type ActionType,
    type ActionFunctionType,
    type ActionGoToType,
    type ActionInputType,
    type ActionCheckBoxType,
    type ActionsType,
    type MenuItemType,
    type MenuType,
    type PluginType
};