import { Menu, Menus } from "@/classes/Menu";
import { MenuType } from "./Menu";
import { Action, Actions } from "@/classes/Action";
import { ActionType } from "./Action";
import { Language } from "@/classes/Language";
import { LanguageType, RequestLanguagesType } from "./Language";

export type PluginType = {
    name: string;
    index?: number;
    menus?: Menus | MenuType | Array<Menu | MenuType>;
    actions?: Actions | ActionType | Array<Action | ActionType>;
    languages?: Language | LanguageType | RequestLanguagesType  | Array<Language | LanguageType>;
}
