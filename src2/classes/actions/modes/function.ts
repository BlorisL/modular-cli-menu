
import { Action } from "../action";
import { Menu } from "../../menus/menu";

export class FunctionAction extends Action {
    constructor(key: string, private fn: () => Promise<void> | void, private after: 'none' | 'rerender' | 'back' = 'none') {
        super(key);
    }
    async execute() {
        let result = this.fn();
        if (result instanceof Promise) await result;
        switch (this.after) {
            case 'back':
                const parent = this.parent?.parent;
                if (parent instanceof Menu) {
                    await parent.render();
                } else if (parent instanceof Action) {
                    await parent.execute();
                } else {
                    console.log("⚠️ Nessun parent disponibile!");
                }
                break;
            case 'rerender':
                if (this.parent instanceof Menu) {
                    await this.parent.render();
                }
                break;
            case 'none':
            default:
                // do nothing
                break;
        }
    }
}