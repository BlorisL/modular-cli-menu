import { Action } from "../action";

export class ExitAction extends Action {
    constructor(key: string) {
        super(key);
    }
    execute() {
        console.log("❌ Uscita dal programma.");
        process.exit(0); // se sei in Node.js
    }
}