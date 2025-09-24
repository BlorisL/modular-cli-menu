import { I18n } from "../Language";
import { Action, ActionType, ActionTypes } from "./action";

type ActionFunctionType = ActionType & {
    mode: 'function';
    callback?: () => Promise<unknown>;
};

class ActionFunction extends Action {

    static readonly MODE_NAME = 'function';
    
    protected mode: ActionTypes;
    protected callback?: () => Promise<unknown>;
    
    public constructor(params: ActionFunctionType) {
        super(params);
        this.mode = ActionFunction.MODE_NAME;
        this.callback = params?.callback;
    }

    public toObject(): ActionFunctionType {
        return {
            mode: this.mode as ActionFunctionType['mode'],
            name: this.name,
            index: this.index,
            message: this.message,
            color: this.color,
            //parent: this.parent,
            callback: this.callback
        };
    }

    public async call(): Promise<unknown> {
        if (this.getMessage()) {
            console.log(I18n.getNameTranslation(this));
        }

        if (this.callback) {
            return await this.callback();
        }
    }
}

export { 
    ActionFunction,
    type ActionFunctionType
};