import { Action, ActionConfig, ActionOptions, ModeType } from "./action";

type ActionFunctionOptions = ActionOptions & {
};

type ActionFunctionConfig = ActionConfig & {
    callback: (params?: ActionFunctionOptions) => Promise<unknown>;
}

class ActionFunction extends Action {
    static readonly MODE_NAME = 'function';

    protected mode: ModeType = ActionFunction.MODE_NAME;
    protected callback: (params?: ActionFunctionOptions) => Promise<unknown>;

    public constructor(config: ActionFunctionConfig) {
        super(config);
        this.callback = config.callback;
    }

    public getMode(): ModeType { return this.mode; }

    public getCallback(params?: ActionFunctionOptions): Promise<unknown> | undefined { 
        return this.callback!(params);
    }

    public override toObject(): ActionFunctionConfig {
        return {
            ...super.toObject(),
            callback: this.callback,
        };
    }

    public async run(options: ActionFunctionOptions) {
        return await this.callback();
    }
}

export {
    ActionFunction,
    type ActionFunctionConfig
};