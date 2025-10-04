import { Menu } from "../menu";
import { Action, ActionConfig, ActionOptions, ModeType } from "./action";

type ActionGoToOptions = ActionOptions & {
};

type ActionGoToConfig = ActionConfig & {
    to?: string;
    before?: (options: ActionGoToOptions) => Promise<unknown>;
}

class ActionGoTo extends Action {
    static readonly MODE_NAME = 'goto';

    protected mode: ModeType = ActionGoTo.MODE_NAME;
    protected to?: string;
    protected before?: (options: ActionGoToOptions) => Promise<unknown>;

    public constructor(config: ActionGoToConfig) {
        super(config);
        this.to = config.to;
        this.before = config.before;
    }

    public getMode(): ModeType { return this.mode; }

    public async run(options: ActionGoToOptions) {
        if(this.before) {
            await this.before(options);
        }

        let item: Menu | Action | undefined = undefined;
        if(this.to) {
            item = options.findMenu(this.to) || options.findAction(this.to);
        //} else if(this.getParent()) {
        //    item = this.getParent();
        } else {
            item = options.findMenu('main')!;
        }

        setTimeout(() => {
            console.log('')
            console.log('### Action')
            console.log(this)
            console.log('### Item')
            console.log(item)
        }, 1000);
        if(item instanceof Action) {
            return await (item as Action).run(options);
        } else {
            return await (item as Menu).print(options);
        }
    }
}

export {
    ActionGoTo,
    type ActionGoToConfig
};