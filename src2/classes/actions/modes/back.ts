import { Action } from "../action";
import { Menu } from "../../menus/menu";
import { Parent } from "../../../types";

export class BackAction extends Action {
    constructor(key: string) {
        super(key);
    }
    async execute() {
        const parent = this.parent?.parent;
        if (parent && parent instanceof Menu) {
            await parent.render();
        } else if (parent && parent instanceof Action) {
            await parent.execute();
        } else {
            console.log("⚠️ Nessun parent disponibile!");
        }
    }
}