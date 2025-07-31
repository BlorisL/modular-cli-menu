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
        options = {}
    }: {
        menus: Menus;
        actions: Actions;
        options?: InputType | ChoiceType;
    }): Promise<unknown> {
        const defaultActions: string[] = ['separator'];

        if (this.getName() !== 'language') {
            defaultActions.push('language');
        }

        if (this.getName() !== 'main') {
            defaultActions.push('goback');
        }
        defaultActions.push('exit');

        console.clear();

        return Promise.resolve(defaultActions);
    }
}

class MenuInput extends Menu {

    public constructor(options: MenuType & MenuInputType) {
        super(options);
    }

    public override async call({
        menus,
        actions,
        options = {}
    }:{
        menus: Menus;
        actions: Actions;
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
        options = {}
    }: {
        menus: Menus;
        actions: Actions;
        options?: ChoiceType;
    }) {
        const defaultActions = await super.call({ menus, actions, options }) as string[];

        const answer = await choices({
            ...options,
            message: I18n.getNameTranslation(this),
            choices: [...this.getActions(), ...defaultActions]
                .filter(actionLabel => actionLabel === 'separator' || actions.get(actionLabel))
                .map(actionLabel => {
                    if (actionLabel === 'separator') return new Separator();
                    const action = actions.get(actionLabel);
                    return {
                        name: I18n.getNameTranslation(action!),
                        value: action!.getName(),
                        isMulti: typeof actionLabel !== 'string' && actionLabel?.isMulti === true
                    };
                }),
        }) as string[];

        return await Promise.all(
            (actions.some(answer) ?? []).map(action => {
                if (action.getMode() === 'goto' && action.getName() !== 'goback') {
                    menus.addToHistory(this.getName());
                }
                return action.call({ menus, actions });
            })
        );
    }
}

class Menus {
    private items: MenusType;
    private sortedItems: Menu[];
    private history: string[] = [];

    public constructor(...actions: Menu[]) {
        this.items = {};
        this.sortedItems = [];

        actions.map(action => this.add(action));
        this.setSortedItems();
    }

    public addToHistory(menuName: string): void {
        this.history.push(menuName);
    }

    public delFromHistory(): string | undefined {
        return this.history.pop();
    }

    public getLastMenuOpened(): Menu { 
        let menu = this.get(this.delFromHistory() ?? 'main'); 
        if (!menu) {
            menu = this.get('main')!;
        }
        return menu;
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
    public has(name: string): boolean { return this.get(name) !== undefined; }
    
    public getParentMenu(menuName: string): Menu | undefined {
        const currentMenu = this.get(menuName);
        if (currentMenu && currentMenu.getParent()) {
            return this.get(currentMenu.getParent()!);
        }
        return this.get('main');
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