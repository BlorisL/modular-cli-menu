// plugins/language/ChangeLanguageAction.ts

import { Action } from "../../actions/Action";
import { Parent } from "../../types";
import { LanguageMenu } from "./LanguageMenu";

export class ChangeLanguageAction extends Action {
    constructor(label: string, private current: Parent) {
        super(label);
    }

    async execute() {
        const langMenu = new LanguageMenu();
        langMenu.parent = this.current;
        await langMenu.render();
    }
}