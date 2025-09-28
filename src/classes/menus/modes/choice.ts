import { Menu } from "../menu";
import { Action } from "../../actions/action";

export class ChoiceMenu extends Menu {
    private actions: Action[] = [];

    addAction(action: Action) {
        this.actions.push(action);
    }

    getCustomActions(): Action[] {
        return this.actions;
    }
}
