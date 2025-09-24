import { ColorName } from "chalk";
import { Menu } from "../menus/item";

type ActionTypes = 'function' | 'goto';

type ActionType = {
    name: string;
    index?: number;
    message?: string;
    color?: ColorName;
    //parent?: string;
    mode: ActionTypes;
}

abstract class Action {
    protected abstract mode: ActionTypes;
    protected name: ActionType['name'];
    protected index?: ActionType['index'];
    protected message?: ActionType['message'];
    protected color?: ActionType['color'];
    //protected parent?: string;

    public constructor(params: ActionType) {
        this.name = params.name;
        this.index = params.index;
        this.message = params.message;
        this.color = params.color;
        //this.parent = params.parent;
    }

    public getMode(): ActionTypes { return this.mode; }

    public getName(): string { return this.name; }
    public setName(name: string): void { this.name = name; }

    public getIndex(): number | undefined { return this.index; }
    public setIndex(index: number): void { this.index = index; }

    public getMessage(): string | undefined { return this.message; }
    public setMessage(message: string): void { this.message = message; }

    public getColor(): ColorName | undefined { return this.color; }
    public setColor(color: ColorName): void { this.color = color; }

    public getNameTranslation(): string { 
        let label = this.getMessage() ?? '';
        if(!label || label.length === 0) {
            label = `action.${this.getName()}.label`;
        }
        return label; 
    }
    
    public getMessageTranslation(): string { 
        let label = this.getMessage();
        if(!label || label.length === 0) {
            label = `action.${this.getName()}.message`;
        }

        return label;
    }

    //public getParent(): string | undefined { return this.parent; }
    //public setParent(parent: string): void { this.parent = parent; }

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