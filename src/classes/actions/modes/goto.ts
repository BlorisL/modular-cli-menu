import { I18n } from "../../languages/i18n";
import { Action, ActionType, ActionTypes } from "../item";

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
    //protected after?: ActionGoToType['after'];
    
    public constructor(params: ActionGoToType) {
        super(params);
        this.mode = ActionGoTo.MODE_NAME;
        this.to = params?.to;
        this.before = params?.before;
        //this.after = params?.after;
    }
    
    public toObject(): ActionGoToType {
        return {
            plugin: this.getPlugin(),
            mode: this.mode as ActionGoToType['mode'],
            name: this.name,
            index: this.index,
            message: this.message,
            color: this.color,
            //parent: this.parent,
            before: this.before,
            //after: this.after
        };
    }

    public async run(): Promise<unknown> {
        if (this.getMessage()) {
            console.log(I18n.getTranslation(this.getNameTranslation(), this.getColor()));
        }

        if (this.before) {
            await this.before();
        }

        if (this.to) {
            console.log(`Going to menu: ${this.to}`);
        }

        //if (this.after) {
        //    await this.after();
        //}
        return undefined;
    }
}

export { 
    ActionGoTo,
    type ActionGoToType
};