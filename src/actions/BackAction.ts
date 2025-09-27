import { Action } from "./Action";
import { Parent } from "../types";
import { Menu } from "../menus/Menu";

export class BackAction extends Action {
    constructor(label: string, private current: Parent) {
        super(label);
    }

    async execute() {
        const parent = this.current?.parent;
        if (parent && parent instanceof Menu) {
            // torna al menu padre (che può rigenerare la UI)
            await parent.render();
        } else if (parent && parent instanceof Action) {
            // torna all'action padre
            await parent.execute();
        } else {
            console.log("⚠️ Nessun parent disponibile!");
        }
    }
}
