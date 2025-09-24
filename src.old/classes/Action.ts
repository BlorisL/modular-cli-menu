import { ColorName } from "chalk";
import { Menu, Menus } from "./Menu";
import { I18n } from "./Language";
import { ActionFunctionType, ActionGoToType, ActionMode, ActionsType, ActionType } from "@/types/Action";
import { ActionChoiceType } from "@/types/Menu";
import { Item } from "./Item";

class Action extends Item {
    protected options: ActionFunctionType['options'] | ActionGoToType['options'];

    public constructor(params: ActionType) {
        super(params);
        
        this.options = {};
        if (params.mode === 'function') {
            this.options = { callback: params.options?.callback };
        } else if (params.mode === 'goto') {
            this.options = { 
                to: params.options?.to, 
                after: params.options?.after, 
                callback: params.options?.callback 
            };
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
                const options = (this.options as ActionGoToType['options']);

                if (this.getName() === 'goback') {
                    menu = menus.getLastMenuOpened();
                } else {
                    menu =  menus.get(options?.to || 'main')!;
                }
                
                console.log(options)

                console.log('0', this)
                const input = await menu.call({ menus, actions });

                if(options?.callback) {
                    await options.callback({ menus, actions, action: this, value: input });
                }

                console.log('a', options)

                if(options?.after !== undefined) {
                    menu = menus.get(options.after ?? 'main')!;
                }

                console.log('b', menu)

                return await menu.call({ menus, actions, options });
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