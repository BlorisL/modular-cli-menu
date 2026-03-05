import { ActionFunctionJson, ActionGotoJson } from "../actions";
import { MenuFieldJson } from "../menus";
import { TranslationJson } from "../translations";

type PluginJson = {
    name: string;
    menus?: Array<MenuFieldJson>;
    actions?: Array<ActionGotoJson | ActionFunctionJson>;
    translations?: TranslationJson;
};

export { PluginJson };