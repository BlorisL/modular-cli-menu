import { ColorName } from "chalk";
import { Menu, Menus } from "./Menu";
import { I18n } from "./Language";
import { ActionMode, ActionsType, ActionType } from "@/types/Action";
import { ActionChoiceType } from "@/types/Menu";

class Action {
    private mode: ActionMode;
    private name: string;
    private index?: number;
    private message?: string;
    private color?: ColorName;
    private options?: Record<string, any>;

    public constructor(options: ActionType) {
        this.mode = options.mode;
        this.name = options.name;
        this.index = options.index ?? undefined;
        this.message = options.message ?? undefined;
        this.color = options.color ?? undefined;
        
        this.options = {};
        if (options.mode === 'function') {
            if(options.callback) {
                this.options.callback = options.callback;
            }
        } else if (options.mode === 'goto') {
            if(options.to) {
                this.options.to = options.to;
            }
        }
    }

    public getMode(): string { return this.mode; }
    public setMode(mode: ActionMode): this { this.mode = mode; return this; }

    public getName(): string { return this.name; }
    public setName(name: string): this { this.name = name; return this; }

    public getIndex(): number | undefined { return this.index; }
    public setIndex(index: number): this { this.index = index; return this; }

    public getMessage(): string | undefined { return this.message; }
    public setMessage(message: string): this { this.message = message; return this; }

    public getColor(): ColorName | undefined { return this.color; }
    public setColor(color: ColorName): this { this.color = color; return this; }
    
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