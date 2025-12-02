import { ActionFunctionJson, ActionGotoJson } from "../actions";
import { MenuChoiceJson } from "../menus";
import { TranslationJson } from "../translations";

type PluginJson = {
    name: string;
    menus?: Array<MenuChoiceJson>;
    actions?: Array<ActionGotoJson | ActionFunctionJson>;
    translations?: TranslationJson;
};

export { PluginJson };