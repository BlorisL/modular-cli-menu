import { Menu } from "../menus/item";
import { BaseItem, BaseItemType } from "../BaseItem";

type ActionTypes = 'function' | 'goto';

type ActionType = BaseItemType & {
    mode: ActionTypes;
}

abstract class Action extends BaseItem<ActionTypes> {

    public constructor(params: ActionType) {
        super(params);
    }

    protected getType(): string { return 'action'; }

    public abstract toObject(): ActionType;

    public abstract run({
        findMenu,
        findAction,
    }: {
        [key: string]: any;
        findMenu?: ({ pluginName, menuName }: { pluginName: string; menuName: string }) => Menu | undefined;
        findAction?: ({ pluginName, actionName }: { pluginName: string; actionName: string }) => Action | undefined;
    }): Promise<unknown>;
}

export { 
    Action, 
    type ActionTypes,
    type ActionType,
}