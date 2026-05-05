import { Action, ActionJson } from "@/components/actions/action";

type ActionFunctionJson = ActionJson & {
    type: "function";
    callback: () => Promise<void>;
};

class ActionFunction extends Action {
    protected type: ActionFunctionJson["type"] = "function";
    protected callback: ActionFunctionJson["callback"];

    /**
     * Creates a new function action that executes an async callback.
     * @param data Action JSON including name and callback function.
     */
    constructor(data: ActionFunctionJson) {
        super(data);
        this.callback = data.callback;
    }

    /** Invokes and returns the result of the stored callback. */
    public getCallback(): Promise<void> {
        return this.callback();
    }

    /**
     * Replaces the stored callback function.
     * @param callback Async function executed when the action runs.
     */
    public setCallback(callback: ActionFunction["callback"]): this {
        this.callback = callback;
        return this;
    }

    /** Serialises this function action to a plain JSON-compatible object. */
    public toJson(): ActionFunctionJson {
        return {
            ...super.toJson(),
            type: this.type,
            callback: this.callback,
        };
    }

    /** Executes the action by invoking the stored async callback. */
    public async run(): Promise<void> {
        return await this.getCallback();
    }
}

export { ActionFunction, type ActionFunctionJson };
