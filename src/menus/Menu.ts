import { Action } from "../actions/Action";
import { BackAction } from "../actions/BackAction";
import { ExitAction } from "../actions/ExitAction";
import { Parent } from "../types";
import { choices } from "../prompts/Choices";
import { Separator } from "@inquirer/core";
import { Translation } from "../i18n/Translation";

type GlobalActionProvider = (menu: Menu) => Action;

export abstract class Menu {
    static globalActionProviders: GlobalActionProvider[] = [];

    parent: Parent = null;

    constructor(public id: string, public key: string) {}

    get title(): string {
        return Translation.t(this.key);
    }

    abstract getCustomActions(): Action[];

    async render(): Promise<void> {
        const custom = this.getCustomActions() || [];
        const global = this.getGlobalActions();

        const actions: Array<Action | null> = custom.length > 0 ? [...custom, null, ...global] : [...global];
        const idMap = new Map<string, Action>();

        const items = actions.map((a, idx) => {
            if (!a) return new Separator();
            a.parent = this;
            const id = `${this.id}::${idx}`;
            idMap.set(id, a);
            return { name: a.label, value: id, isMulti: false };
        });

        const result = await choices({
            message: this.title,
            choices: items,
        });

        const selected = result as string[];
        const selectedId = selected?.[0];
        if (!selectedId) return;

        const action = idMap.get(selectedId);
        if (!action) {
            console.error("Azione selezionata non trovata:", selectedId);
            return;
        }

        await action.execute();
    }

    private getGlobalActions(): Action[] {
        const actions: Action[] = [];

        if (this.parent) {
            actions.push(new BackAction("label_back", this));
        }

        Menu.globalActionProviders.forEach(provider => {
            actions.push(provider(this));
        });

        actions.push(new ExitAction("label_exit"));

        return actions;
    }
}