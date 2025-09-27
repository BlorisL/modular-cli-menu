import { Action } from "../actions/item";
import { BaseItem, BaseItemType } from "../BaseItem";

type MenuTypes = 'input' | 'choices';

type MenuType = BaseItemType & {
    mode: MenuTypes;
    //parent?: string;
};

abstract class Menu extends BaseItem<MenuTypes> {
    //protected parent: MenuType['parent'];

    public constructor(params: MenuType) {
        super(params);
        //this.parent = params.parent;
    }

    protected getType(): string { return 'menu'; }

    //public getParent(): MenuType['parent'] { return this.parent; }
    //public setParent(parent: MenuType['parent']): this { this.parent = parent; return this; }

    public abstract toObject(): MenuType;

    public abstract print({
        findMenu,
        findAction,
    }: {
        [key: string]: any;
        findMenu?: ({ pluginName, menuName }: { pluginName: string; menuName: string }) => Menu | undefined;
        findAction?: ({ pluginName, actionName }: { pluginName: string; actionName: string }) => Action | undefined;
    }): Promise<unknown>;
}

export { 
    Menu,
    type MenuTypes,
    type MenuType
};