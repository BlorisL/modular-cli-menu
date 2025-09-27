import { Menu } from "./Menu";
import { Action } from "../actions/Action";

export class ChoiceMenu extends Menu {
    private actions: Action[] = [];

    addAction(action: Action) {
        this.actions.push(action);
    }

    getCustomActions(): Action[] {
        return this.actions;
    }
}
