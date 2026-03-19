import { ActionFunctionJson, ActionGotoJson } from "../actions";
import { MenuFieldJson } from "../menus/field";
import { MenuChoiceJson } from "../menus/choice";
import { MenuInputJson } from "../menus/input";
import { TranslationJson } from "../translations";

type PluginJson = {
    name: string;
    menus?: Array<MenuChoiceJson | MenuInputJson | MenuFieldJson>;
    actions?: Array<ActionGotoJson | ActionFunctionJson>;
    translations?: TranslationJson;
};

export { PluginJson };
