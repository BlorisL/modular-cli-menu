import { Menu } from "../menu";
import { Action, ActionConfig, ActionOptions, ModeType } from "./action";

type ActionGoToOptions = ActionOptions & {
};

type ActionGoToConfig = ActionConfig & {
    to?: string;
    before?: (params: ActionGoToOptions) => Promise<unknown>;
}

class ActionGoTo extends Action {
    static readonly MODE_NAME = 'goto';

    protected mode: ModeType = ActionGoTo.MODE_NAME;
    protected to?: string;
    protected before?: (params: ActionGoToOptions) => Promise<unknown>;

    public constructor(config: ActionGoToConfig) {
        super(config);
        this.to = config.to;
        this.before = config.before;
    }

    public getMode(): ModeType { return this.mode; }

    public getTo(): string | undefined { return this.to; }
    public isTo(): boolean { return this.to !== undefined && this.to.length > 0; }

    public isBefore(): boolean { return this.before !== undefined; }
    public getBefore(params: ActionGoToOptions): Promise<unknown> | undefined { 
        return this.isBefore() ? this.before!(params) : undefined;
    }

    public async run(params: ActionGoToOptions) {
        const action = await (super.run(params) as Promise<this>);

        if(action.isBefore()) {
            await action.getBefore(params);
        }

        let item: Menu | Action | undefined = undefined;
        if(action.isTo()) {
            item = params.findMenu(this.getTo()!) || params.findAction(this.getTo()!);
        //} else if(this.getParent()) {
        //    item = this.getParent();
        } else if(params?.from) {
            item = params.from;
        } else {
            item = params.findMenu('main')! || params.findAction('main')!;
        }

        setTimeout(() => {
            console.log('')
            console.log('### Action')
            console.log(this)
            console.log('### Item')
            console.log(item)
        }, 1000);
        if(item instanceof Action) {
            return await (item as Action).run({
                ...params,
                from: item.getFrom()
            });
        } else {
            return await (item as Menu).print({
                ...params,
                from: item!.getFrom()
            });
        }
    }
}

export {
    ActionGoTo,
    type ActionGoToConfig
};