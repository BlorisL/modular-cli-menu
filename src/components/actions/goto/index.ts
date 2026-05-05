import { Action, ActionJson } from "@/components/actions/action";

type ActionGotoJson = ActionJson & {
    type: "goto";
    to: string;
};

class ActionGoto extends Action {
    protected type: ActionGotoJson["type"] = "goto";
    protected to: ActionGotoJson["to"];

    /**
     * Creates a new goto action that navigates to a target menu.
     * @param data Action JSON including name and target menu name (to).
     */
    constructor(data: ActionGotoJson) {
        super(data);
        this.to = data.to;
    }

    /**
     * Sets the display name for this goto action.
     * @param name Unique action name.
     */
    public setName(name: ActionGoto["name"]): this {
        this.name = name;
        return this;
    }

    /** Returns the target menu name this action navigates to. */
    public getTo(): ActionGoto["to"] {
        return this.to;
    }

    /**
     * Sets the target menu name.
     * @param to Target menu name.
     */
    public setTo(to: ActionGoto["to"]): this {
        this.to = to;
        return this;
    }

    /** Serialises this goto action to a plain JSON-compatible object. */
    public toJson(): ActionGotoJson {
        return {
            ...super.toJson(),
            type: this.type,
            to: this.to,
        };
    }

    /** Executes the goto action (returns this instance; navigation is handled by the CLI runner). */
    public async run(): Promise<this> {
        return this;
    }
}

export { ActionGoto, type ActionGotoJson };
