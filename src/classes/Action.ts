import { ColorName } from "chalk";
import { Menus } from "./Menu";
import { I18n } from "./Language";

type ActionsType = Record<string, Action>;

type ActionType = {
    name: string;
    index?: number;
    message?: string;
    color?: ColorName;
    callback?: (args: { menus: Menus; actions: Actions; parent?: string, action: Action }) => Promise<unknown>;
}

class Action {
    private name: string;
    private index?: number;
    private callback?: (args: { menus: Menus, actions: Actions, parent?: string, action: Action }) => Promise<any>;
    private message?: string;
    private color?: ColorName;


    public constructor(options: ActionType) {
        this.name = options.name;
        this.index = options.index ?? undefined;
        this.message = options.message ?? undefined;
        this.color = options.color ?? undefined;
        this.callback = options.callback ?? undefined;
    }

    public getName(): string { return this.name; }
    public setName(name: string): this { this.name = name; return this; }

    public getIndex(): number | undefined { return this.index; }
    public setIndex(index: number): this { this.index = index; return this; }

    public getMessage(): string | undefined { return this.message; }
    public setMessage(message: string): this { this.message = message; return this; }

    public getColor(): ColorName | undefined { return this.color; }
    public setColor(color: ColorName): this { this.color = color; return this; }
    
    public async call(menus: Menus, actions: Actions, parent?: string) {
        if(this.getMessage()) {
            console.log(I18n.getTranslation(this.getMessage(), this.getColor()));
        }
        if(this.callback) {
            return await this.callback({ menus, actions, parent, action: this });
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
    public get(name: string): Action | undefined { return this.items[name]; }
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

export { type ActionsType, Actions, type ActionType, Action };