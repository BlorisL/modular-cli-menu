import { Action, ActionType } from "./item";
import { ActionFunction, ActionFunctionType } from "./modes/function";
import { ActionGoTo, ActionGoToType } from "./modes/goto";


type ActionsItemType = ActionFunctionType | ActionGoToType;
type ActionsType = Record<string, ActionsItemType>;

class Actions {
    protected items: Record<string, Action> = {};

    public constructor(items: ActionsType = {}) {
        Object.keys(items).forEach((key) => this.add(items[key]));
    }
    
    public add(item: ActionsItemType): this { 
        let tmp: Action;
        switch(item.mode) {
            case ActionFunction.MODE_NAME:
                tmp = new ActionFunction(item);
                break;
            case ActionGoTo.MODE_NAME:
                tmp = new ActionGoTo(item);
                break;
        }
        if(tmp !== undefined) {
            this.items[tmp.getName()] = tmp;
        }
        return this; 
    }

    public get(name: string): Action | undefined { return this.items[name]; }

    public toObject(): ActionsType {
        const obj: ActionsType = {};
        Object.keys(this.items).forEach((key) => {
            const item = this.items[key];
            obj[key] = item.toObject();
        });
        return obj;
    }

    public toArray(): Action[] {
        return Object.values(this.items).sort((a, b) => 
            (a.getIndex() ?? Infinity) - (b.getIndex() ?? Infinity)
        );
    }
}

export { 
    Actions, 
    type ActionsType 
};