import { ColorName } from "chalk";
import { Menu, Menus } from "./Menu";
import { I18n } from "./Language";
import { ActionMode, ActionsType, ActionType } from "@/types/Action";
import { ActionChoiceType } from "@/types/Menu";
import { Item } from "./Item";

class Action extends Item {
    protected options?: Record<string, any>;

    public constructor(params: ActionType) {
        super(params);
        
        this.options = {};
        if (params.mode === 'function') {
            if(params.options?.callback) {
                this.options.callback = params.options.callback;
            }
        } else if (params.mode === 'goto') {
            if(params.options?.to) {
                this.options.to = params.options.to;
            }
        }
    }

    public getNameTranslation(): string { 
        let label = this.getMessage() ?? '';
        if(!label || label.length === 0) {
            label = `action.${this.getName()}.label`;
        }
        return label; 
    }
    
    public getMessageTranslation(): string { 
        let label = this.getMessage();
        if(!label || label.length === 0) {
            label = `action.${this.getName()}.message`;
        }

        return label;
    }
    
    public async call({
        menus,
        actions
    }: {
        menus: Menus;
        actions: Actions;
    }): Promise<unknown> {
        if (this.getMessage()) {
            console.log(I18n.getNameTranslation(this));
        }

        switch (this.mode) {
            case 'function':
                if (this.options?.callback) {
                    return await this.options.callback({ menus, actions, action: this });
                }
                break;
            case 'goto':
                let menu: Menu;
                if (this.getName() === 'goback') {
                    menu = menus.getLastMenuOpened();
                } else {
                    menu =  menus.get(this.options?.to || 'main')!;
                }
                
                return await menu.call({ menus, actions });
                break;
        }
    }
}

class Actions {
    private items: ActionsType;
    private sortedItems: Action[];

    public constructor(...actions: Action[]) {
        this.items = {};
        this.sortedItems = [];

        actions.map(action => this.add(action));
        this.setSortedItems();
    }

    public getAll(sorted: boolean = true): Action[] {
        return sorted ? this.sortedItems : Object.values(this.items);
    }
    public add(items: Action | ActionType | Array<Action | ActionType>): this {
        if(!Array.isArray(items)) {
            items = [items];
        }
        items.forEach(item => {
            const action = item instanceof Action ? item : new Action(item);
            this.items[action.getName()] = action;
        });
        this.setSortedItems();
        return this;
    }
    public some(choices: ActionChoiceType[]): Action[] | undefined { 
        const tmp: Action[] = [];
        choices.forEach(choice => {
            const action = this.get(choice);
            if(action) {
                tmp.push(action);
            }
        });
        return tmp;
    }
    public get(choice: ActionChoiceType): Action | undefined { 
        return this.items[typeof choice === 'string' ? choice : choice.value]; 
    }
    private setSortedItems(): void {
        this.sortedItems = Object.values(this.items).sort((a, b) => {
            const aIndex = a.getIndex();
            const bIndex = b.getIndex();

            if (aIndex === undefined && bIndex === undefined) return 0;
            if (aIndex === undefined) return 1;
            if (bIndex === undefined) return -1;
            return aIndex - bIndex;
        });
    }
}

export { Actions, Action };