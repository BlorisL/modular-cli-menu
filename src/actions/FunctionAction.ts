import { Action } from "./Action";

export class FunctionAction extends Action {
    constructor(label: string, private fn: () => void) {
        super(label);
    }

    execute() {
        this.fn();
    }
}
