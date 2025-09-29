type ModeTypes = 'input' | 'choices';

type ActionConfig = {
    mode: ModeTypes;
    name: string;
    parent?: string;
}

class Action {
    protected mode: ModeTypes;
    protected name: string;
    protected parent?: Action | string;

    public constructor(config: ActionConfig) {
        this.mode = config.mode;
        this.name = config.name;
    }

    public getMode(): ModeTypes { return this.mode; }

    public getName(): string { return this.name; }

    public getParent(): Action | string | undefined { return this.parent; }
    public setParent(parent: Action | undefined): this { this.parent = parent; return this; }
}

export {
    Action,
    //type ModeTypes,
    type ActionConfig
}