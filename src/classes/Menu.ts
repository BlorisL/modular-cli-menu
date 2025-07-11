import chalk, { ColorName } from "chalk";
import { Action, Actions, type ActionsType } from "./Action";
import select, { Separator } from '@inquirer/select';
import { I18n } from "./Language";

type MenusType = Record<string, Menu>;
type MenuMode = 'select' | 'input' | 'checkbox'; // | 'function' | 'goto';

type MenuType = {
    mode: MenuMode;
    name: string;
    parent?: Menu;
    index?: number;
    message: string;
    color?: ColorName;
    actions?: string[];
}

class Menu {
    private mode: MenuMode;
    private name: string;
    private parent?: Menu;
    private index?: number;
    private message: string;
    private color?: ColorName;
    private actions: string[];

    public constructor(options: MenuType) {
        this.mode = options.mode;
        this.name = options.name;
        this.parent = options.parent ?? undefined;
        this.index = options.index ?? undefined;
        this.message = options.message;
        this.actions = options.actions ?? [];
        this.color = options.color ?? undefined;
    }

    public getMode(): MenuMode { return this.mode; }
    public setMode(mode: MenuMode): this { this.mode = mode; return this; }

    public getName(): string { return this.name; }
    public setName(name: string): this { this.name = name; return this; }

    public getParent(): Menu | undefined { return this.parent; }
    public setParent(parent: Menu): this { this.parent = parent; return this; }

    public getIndex(): number | undefined { return this.index; }
    public setIndex(index: number): this { this.index = index; return this; }

    public getMessage(): string | undefined { return this.message; }
    public setMessage(message: string): this { this.message = message; return this; }

    public getActions(): string[] { return this.actions; }
    public setActions(actions: string[]): this { this.actions = actions; return this; }
    public addAction(action: string): this { this.actions.push(action); return this; }

    public getColor(): ColorName | undefined { return this.color; }
    public setColor(color: ColorName): this { this.color = color; return this; }

    public async call(menus: Menus, actions: Actions, parent?: string) {
        switch (this.mode) {
            case 'select':
                const answer = await select({
                    message: I18n.getTranslation(this.getMessage(), this.getColor()),
                    choices: this.getActions(),
                }) as string;
                return actions.get(answer)?.call(menus, actions, this.getName());
            case 'input': break;
            case 'checkbox': break;
            //case 'function': break;
            //case 'goto': break;
        }
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
            const menu = item instanceof Menu ? item : new Menu(item);
            this.items[menu.getName()] = menu;
        });
        this.setSortedItems();
        return this;
    }
    public get(name: string): Menu | undefined { return this.items[name]; }
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

export { type MenusType, Menus, type MenuType, Menu };