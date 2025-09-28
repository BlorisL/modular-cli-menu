import { Action } from "../actions/action";
import { BackAction } from "../actions/modes/back";
import { ExitAction } from "../actions/modes/exit";
import { Parent } from "../../types";
import { choices } from "../../prompts/Choices";
import { Separator } from "@inquirer/core";
import { Translation } from "../i18n/Translation";

type GlobalActionProvider = (menu: Menu) => Action | null;

export abstract class Menu {
    static globalActionProviders: GlobalActionProvider[] = [];
    parent: Parent = null;
    constructor(public id: string, public key: string) { }
    get title(): string {
        return Translation.t(this.key);
    }
    abstract getCustomActions(): Action[];
    async render(): Promise<void> {
        const custom = this.getCustomActions() || [];
        const global = this.getGlobalActions();
        // Combina azioni personalizzate e globali, aggiungendo un separatore tra di loro se ci sono azioni personalizzate
        const actions: Array<Action | null> = [
            ...custom,
            ...(custom.length > 0 ? [null] : []), // Aggiungi separatore solo se ci sono customActions
            ...global.filter((action): action is Action => action !== null), // Filtra valori null dalle azioni globali
        ];
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
            choices: items.length > 0 ? items : [new Separator()], // Usa un separatore se non ci sono azioni
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
            actions.push(new BackAction("label_back"));
        }
        Menu.globalActionProviders.forEach(provider => {
            const action = provider(this);
            if (action) {
                actions.push(action);
            }
        });
        actions.push(new ExitAction("label_exit"));
        return actions;
    }
}