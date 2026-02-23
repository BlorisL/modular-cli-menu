import { ActionFunctionJson, ActionGotoJson } from "../actions";
import { MenuChoiceJson, MenuInputJson } from "../menus";
import { TranslationJson } from "../translations";

type PluginJson = {
    name: string;
    menus?: Array<MenuChoiceJson | MenuInputJson>;
    actions?: Array<ActionGotoJson | ActionFunctionJson>;
    translations?: TranslationJson;
};

export { PluginJson };