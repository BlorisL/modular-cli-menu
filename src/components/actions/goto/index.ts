import { Action, ActionJson } from "@/components/actions/action";

type ActionGotoJson = ActionJson & {
    type: "goto";
    to: string;
};

class ActionGoto extends Action {
    protected type: ActionGotoJson["type"] = "goto";
    protected to: ActionGotoJson["to"];

    constructor(data: ActionGotoJson) {
        super(data);
        this.to = data.to;
    }

    public setName(name: ActionGoto["name"]): this {
        this.name = name;
        return this;
    }

    public getTo(): ActionGoto["to"] {
        return this.to;
    }

    public setTo(to: ActionGoto["to"]): this {
        this.to = to;
        return this;
    }

    public toJson(): ActionGotoJson {
        return {
            ...super.toJson(),
            type: this.type,
            to: this.to,
        };
    }

    public async run(): Promise<this> {
        return this;
    }
}

export { ActionGoto, type ActionGotoJson };
