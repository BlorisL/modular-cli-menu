import { ColorName } from "chalk";
import { Actions } from "./Action";
import { I18n } from "./Language";
import input from '@inquirer/input';
import select, { Separator } from '@inquirer/select';
import { ChoiceType, ActionChoiceType, InputType, MenuChoiceType, MenuInputType, MenuMode, MenusType, MenuType } from "@/types/Menu";
import { choices } from "@/prompts/Choices";

abstract class Menu {
    protected mode: MenuMode;
    protected name: string;
    protected parent?: string;
    protected index?: number;
    protected message?: string;
    protected color?: ColorName;

    public constructor(options: MenuType) {
        this.mode = options.mode;
        this.name = options.name;
        this.parent = options.parent ?? undefined;
        this.index = options.index ?? undefined;
        this.message = options.message;
        this.color = options.color ?? undefined;
    }

    public getMode(): MenuMode { return this.mode; }
    public setMode(mode: MenuMode): this { this.mode = mode; return this; }

    public getName(): string { return this.name; }
    public setName(name: string): this { this.name = name; return this; }

    public getParent(): string | undefined { return this.parent; }
    public setParent(parent: string): this { this.parent = parent; return this; }

    public getIndex(): number | undefined { return this.index; }
    public setIndex(index: number): this { this.index = index; return this; }

    public getMessage(): string | undefined { return this.message; }
    public setMessage(message: string): this { this.message = message; return this; }

    public getColor(): ColorName | undefined { return this.color; }
    public setColor(color: ColorName): this { this.color = color; return this; }

    public async call({
        menus,
        actions,
        parent,
        options = {}
    }:{
        menus: Menus;
        actions: Actions;
        parent?: Menu;
        options?: InputType | ChoiceType;
    }): Promise<unknown> {
        const defaultActions: string[] = ['separator'];
        if(this.getName() !== 'language') {
            defaultActions.push('language');
        }
        if(parent && parent.getName() !== this.getName()) {
            defaultActions.push('goback');
        }
        defaultActions.push('exit');

        console.clear();

        return Promise.resolve(defaultActions);
    } 
}

/*class MenuSelect extends Menu {
    private actions: MenuSelectType['actions'];

    public constructor(options: MenuType & MenuSelectType) {
        super(options);
        
        this.actions = options.actions ?? [];
    }

    public getActions(): ActionChoiceType[] { 
        return typeof this.actions === 'function' ? this.actions() : this.actions; 
    }
    public setActions(actions: MenuSelectType['actions']): this { this.actions = actions; return this; }
    public addAction(action: ActionChoiceType | (() => ActionChoiceType[])): this { 
        if (typeof action === 'function') {
            this.actions = action;
        } else if (typeof action === 'object' && action !== null && 'name' in action && 'value' in action) {
            if (!Array.isArray(this.actions)) {
                this.actions = [];
            }
            this.actions.push(action as ActionChoiceType);
        } 
        return this; 
    }

    public override async call({
        menus,
        actions,
        parent,
        options = {}
    }:{
        menus: Menus;
        actions: Actions;
        parent?: Menu;
        options?: SelectType;
    }) {
        const defaultActions: string[] = await super.call({ menus, actions, parent, options }) as string[];

        const answer = await select({
            ...options as SelectType,
            message: I18n.getNameTranslation(this),
            choices: [...this.getActions(), ...defaultActions]
                .filter((actionLabel) => {
                    return actionLabel === 'separator' || actions.get(actionLabel) !== undefined;
                })
                .map((actionLabel) => {
                    let result: { name: string, value: any } | Separator;
                    if (actionLabel === 'separator') {
                        result = new Separator();
                    } else {
                        const action = actions.get(actionLabel);
                        result = {
                            name: I18n.getNameTranslation(action!),
                            value: action!.getName()
                        };
                    }
                    return result;
                }),
        }) as string;
        return await actions.get(answer)?.call({ menus, actions, parent });
    } 
}*/

class MenuInput extends Menu {

    public constructor(options: MenuType & MenuInputType) {
        super(options);
    }

    public override async call({
        menus,
        actions,
        parent,
        options = {}
    }:{
        menus: Menus;
        actions: Actions;
        parent?: Menu;
        options?: InputType;
    }) {
        const answer = await input({
            ...options as InputType,
            message: I18n.getNameTranslation(this),
        });

        return answer;
    } 
}

class MenuChoice extends Menu {
    private actions: MenuChoiceType['actions'];

    public constructor(options: MenuType & MenuChoiceType) {
        super(options);
        
        this.actions = options.actions ?? [];
    }

    public getActions(): ActionChoiceType[] { 
        return typeof this.actions === 'function' ? this.actions() : this.actions; 
    }
    public setActions(actions: MenuChoiceType['actions']): this { this.actions = actions; return this; }
    public addAction(action: ActionChoiceType | (() => ActionChoiceType[])): this { 
        if (typeof action === 'function') {
            this.actions = action;
        } else if (typeof action === 'object' && 'value' in action) {
            if (!Array.isArray(this.actions)) {
                this.actions = [];
            }
            this.actions.push(action as ActionChoiceType);
        } 
        return this; 
    }

    public override async call({
        menus,
        actions,
        parent,
        options = {}
    }:{
        menus: Menus;
        actions: Actions;
        parent?: Menu;
        options?: ChoiceType;
    }) {
        const defaultActions: string[] = await super.call({ menus, actions, parent, options }) as string[];

        const answer = await choices({
            ...options as ChoiceType,
            message: I18n.getNameTranslation(this),
            choices: [...this.getActions(), ...defaultActions]
                .filter((actionLabel) => {
                    return actionLabel === 'separator' || actions.get(actionLabel) !== undefined;
                })
                .map((actionLabel) => {
                    let result: { name: string; value: any; isMulti: boolean } | Separator;
                    if (actionLabel === 'separator') {
                        result = new Separator();
                    } else {
                        const action = actions.get(actionLabel);
                        
                        result = {
                            name: I18n.getNameTranslation(action!),
                            value: action!.getName(),
                            isMulti: typeof actionLabel !== 'string' && actionLabel?.isMulti === true
                        };
                    }
                    return result;
                }),
        }) as string[];

        return await Promise.all(
            (actions.some(answer) ?? []).map(action =>
                action.call({ menus, actions, parent })
            )
        );
    } 
}

class Menus {
    private items: MenusType;
    private sortedItems: Menu[];

    public constructor(...actions: Menu[]) {
        this.items = {};
        this.sortedItems = [];

        actions.map(action => this.add(action));
        this.setSortedItems();
    }

    public getAll(sorted: boolean = true): Menu[] {
        return sorted ? this.sortedItems : Object.values(this.items);
    }
    public add(items: Menu | MenuType | Array<Menu | MenuType>): this {
        if(!Array.isArray(items)) {
            items = [items];
        }
        items.forEach(item => {
            let menu: Menu;
            if(item instanceof Menu) {
                menu = item;
            } else {
                switch(item.mode) {
                    case 'input': menu = new MenuInput(item as MenuType & MenuInputType); break;
                    case 'choice': menu = new MenuChoice(item as MenuType & MenuChoiceType); break;
                }
            }
            this.items[menu.getName()] = menu;
        });
        this.setSortedItems();
        return this;
    }
    public get(name: string): Menu | undefined { return this.items[name]; }
    
    public getParentMenu(menuName: string): Menu | undefined {
        return this.get(this.get(menuName)?.getParent() ?? 'main');
    }

    private setSortedItems(): void {
        this.sortedItems = Object.values(this.items).sort((a, b) => {
            const aIndex = a.getIndex();
            const bIndex = b.getIndex();

            if (aIndex === undefined && bIndex === undefined) return 0;
            if (aIndex === undefined) return 1;
            if (bIndex === undefined) return -1;
            return aIndex - bIndex;
        });
    }
}

export { Menu, MenuInput, MenuChoice, Menus };