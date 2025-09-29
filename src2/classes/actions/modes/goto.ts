import { Action } from "../action";
import { Menu } from "../../menus/menu";

export class GotoAction extends Action {
    public targetMenu: Menu;
    constructor(key: string, targetMenu: Menu) {
        super(key);
        this.targetMenu = targetMenu;
    }
    async execute() {
        this.targetMenu.parent = this.parent;
        await this.targetMenu.render();
    }
}