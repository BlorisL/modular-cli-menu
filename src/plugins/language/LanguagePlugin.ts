// plugins/language/LanguagePlugin.ts

import { Plugin } from "../../types";
import { App } from "../../App";
import { Menu } from "../../menus/Menu";
import { ChangeLanguageAction } from "./ChangeLanguageAction";

export class LanguagePlugin implements Plugin {
    setup(app: App): void {
        Menu.globalActionProviders.push((menu: Menu) => new ChangeLanguageAction("label_change_language", menu));
    }
}