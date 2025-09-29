import { Action } from "@/classes/actions/action";
import { Menu } from "../menu";
import input from "@inquirer/input";

export class InputMenu extends Menu {
    constructor(id: string, key: string, private onSubmit: (value: string) => void) {
        super(id, key);
    }

    getCustomActions() {
        return [];
    }

    async render() {
        const answer = await input({ message: this.title });
        this.onSubmit(answer);
        if (this.parent instanceof Menu) {
            await this.parent.render();
        } else if (this.parent instanceof Action) {
            await this.parent.execute();
        }
    }
}
