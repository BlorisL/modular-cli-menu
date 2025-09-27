import { Action } from "./Action";

export class ExitAction extends Action {
    execute() {
        console.log("❌ Uscita dal programma.");
        process.exit(0); // se sei in Node.js
    }
}
