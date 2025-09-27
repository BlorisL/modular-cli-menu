import { I18n } from "../../languages/i18n";
import { Action, ActionType, ActionTypes } from "../item";

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
            plugin: this.getPlugin(),
            mode: this.mode as ActionFunctionType['mode'],
            name: this.name,
            index: this.index,
            message: this.message,
            color: this.color,
            //parent: this.parent,
            callback: this.callback
        };
    }

    public async run(): Promise<unknown> {
        if (this.getMessage()) {
            console.log(I18n.getTranslation(this.getNameTranslation(), this.getColor()));
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