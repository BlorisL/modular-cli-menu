import { Parent } from "../../types";
import { Translation } from "../i18n/Translation";

export abstract class Action {
    parent: Parent = null;

    constructor(public key: string) {}

    get label(): string {
        return Translation.t(this.key);
    }

    abstract execute(): Promise<void> | void;
}
