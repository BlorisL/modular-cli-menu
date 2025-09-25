import { Action, ActionType } from "./item";
import { ActionFunction, ActionFunctionType } from "./modes/function";
import { ActionGoTo, ActionGoToType } from "./modes/goto";
import { Collection } from "../Collection";


type ActionsItemType = ActionFunctionType | ActionGoToType;
type ActionsType = Record<string, ActionsItemType>;

class Actions extends Collection<Action, ActionsItemType> {
    public constructor(items: ActionsType = {}) {
        super(items, (item: ActionsItemType) => {
            switch(item.mode) {
                case ActionFunction.MODE_NAME:
                    return new ActionFunction(item as ActionFunctionType);
                case ActionGoTo.MODE_NAME:
                    return new ActionGoTo(item as ActionGoToType);
                default:
                    throw new Error(`Unknown action mode: ${(item as any).mode}`);
            }
        });
    }
}

export { 
    Actions, 
    type ActionsType 
};