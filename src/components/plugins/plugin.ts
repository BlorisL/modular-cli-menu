import { ActionFunctionJson, ActionGotoJson } from "../actions";
import { MenuChoiceJson } from "../menus";

type PluginJson = {
    name: string;
    menus?: Array<MenuChoiceJson>;
    actions?: Array<ActionGotoJson | ActionFunctionJson>;
};

export { PluginJson };