import { I18n } from "../Language";
import { Action, ActionType, ActionTypes } from "./action";

type ActionGoToType = ActionType & {
    mode: 'goto';
    to?: string;
    before?: () => Promise<unknown>;
    after?: () => Promise<unknown>;
};

class ActionGoTo extends Action {

    static readonly MODE_NAME = 'goto';

    protected mode: ActionTypes;
    protected to?: ActionGoToType['to'];
    protected before?: ActionGoToType['before'];
    protected after?: ActionGoToType['after'];
    
    public constructor(params: ActionGoToType) {
        super(params);
        this.mode = ActionGoTo.MODE_NAME;
        this.to = params?.to;
        this.before = params?.before;
        this.after = params?.after;
    }
    
    public toObject(): ActionGoToType {
        return {
            mode: this.mode as ActionGoToType['mode'],
            name: this.name,
            index: this.index,
            message: this.message,
            color: this.color,
            //parent: this.parent,
            before: this.before,
            after: this.after
        };
    }

    public async call(): Promise<unknown> {
        if (this.getMessage()) {
            console.log(I18n.getNameTranslation(this));
        }

        if (this.before) {
            return await this.before();
        }

        if (this.to) {
            console.log(`Going to menu: ${this.to}`);
        }

        if (this.after) {
            return await this.after();
        }
    }
}

export { 
    ActionGoTo,
    type ActionGoToType
};