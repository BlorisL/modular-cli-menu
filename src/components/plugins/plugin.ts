import { ActionFunctionJson, ActionGotoJson } from "@/components/actions";
import { MenuFieldJson } from "@/components/menus/field";
import { MenuChoiceJson } from "@/components/menus/choice";
import { MenuInputJson } from "@/components/menus/input";
import { MenuEditorJson } from "@/components/menus/editor";
import { TranslationJson } from "@/components/translations";

type PluginJson = {
    name: string;
    menus?: Array<MenuChoiceJson | MenuInputJson | MenuFieldJson | MenuEditorJson>;
    actions?: Array<ActionGotoJson | ActionFunctionJson>;
    translations?: TranslationJson;
};

export { PluginJson };
