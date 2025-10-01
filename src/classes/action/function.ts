import { Action, ActionConfig, ActionOptions, ModeType } from "./action";

type ActionFunctionOptions = ActionOptions & {
};

type ActionFunctionConfig = ActionConfig & {
    callback: () => Promise<unknown>;
}

class ActionFunction extends Action {
    static readonly MODE_NAME = 'function';

    protected mode: ModeType = ActionFunction.MODE_NAME;
    protected callback: () => Promise<unknown>;

    public constructor(config: ActionFunctionConfig) {
        super({ mode: ActionFunction.MODE_NAME, name: config.name });
        this.callback = config.callback;
    }

    public getMode(): ModeType { return this.mode; }

    public async run(options: ActionFunctionOptions = {}) {
        return await this.callback();
    }
}

export {
    ActionFunction,
    type ActionFunctionConfig
};