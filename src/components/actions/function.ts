import { Action, ActionJson } from "./action";

type ActionFunctionJson = ActionJson & {
    type: 'function';
    callback: () => Promise<void>;
};

class ActionFunction extends Action {
    protected type: ActionFunctionJson['type'] = 'function';
    protected callback: ActionFunctionJson['callback'];

    constructor(data: ActionFunctionJson) {
        super(data);
        this.callback = data.callback;
    }

    public getCallback(): Promise<void> { return this.callback(); }
    public setCallback(callback: ActionFunction['callback']): this { 
        this.callback = callback; 
        return this; 
    }

    public toJson(): ActionFunctionJson {
        return {
            ...super.toJson(),
            type: this.type,
            callback: this.callback
        };
    }

    public async run(): Promise<void> {
        return await this.getCallback();
    }
}

export { ActionFunction, type ActionFunctionJson };