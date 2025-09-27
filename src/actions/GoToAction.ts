// src/actions/GotoAction.ts
import { Action } from "./Action";
import { Menu } from "../menus/Menu";
import { Parent } from "../types";

export class GotoAction extends Action {
    constructor(label: string, private targetMenu: Menu, private current: Parent) {
        super(label);
    }

    async execute() {
        this.targetMenu.parent = this.current;
        await this.targetMenu.render();
    }
}
