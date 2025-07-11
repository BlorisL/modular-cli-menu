import { Action, Actions, ActionType } from "./Action";
import { I18n, Language, LanguageCodeType, Languages, LanguagesType, LanguageType, TranslationType } from "./Language";
import { Menus, Menu, type MenuType } from "./Menu";
import select, { Separator } from '@inquirer/select';

type PluginsType = Record<string, Plugin>;

type PluginType = {
    name: string;
    index?: number;
    menus?: Menus | MenuType | Array<Menu | MenuType>;
    actions?: Actions | ActionType | Array<Action | ActionType>;
    languages?: 
    Language | LanguageType | LanguagesType  | Array<Language | LanguageType>;
}

class Plugin {
    private name: string;
    private index?: number;
    private menus: Menus;
    private actions: Actions;
    //private languages: Languages;

    public constructor(options: PluginType) {
        this.name = options.name;
        this.index = options.index ?? undefined;
        this.menus = new Menus();
        this.addMenu(options.menus);
        this.actions = new Actions();
        this.addAction(options.actions);
        //this.languages = options.languages ?? new Languages();
        I18n.languages.add(options.languages);
    }

    public getName(): string { return this.name; }
    public setName(name: string): this { this.name = name; return this; }

    public getIndex(): number | undefined { return this.index; }
    public setIndex(index: number): this { this.index = index; return this; }

    public getMenus(): Menus { return this.menus; }
    public addMenu(items?: Menus | Menu | MenuType | Array<Menu | MenuType>): this {
        if(items !== undefined) {
            if(items instanceof Menus) {
                this.menus = items;
            } else {
                if(this.menus === undefined) {
                    this.menus = new Menus();
                }

                if (!Array.isArray(items)) {
                    items = [items];
                }

                items.forEach(item => {
                    const menu = item instanceof Menu ? item : new Menu(item);
                    this.menus.add(menu);
                });
            }
        }

        return this;
    }

    public getActions(): Actions { return this.actions; }
    public addAction(items?: Actions | Action | ActionType | Array<Action | ActionType>): this {
        if(items !== undefined) {
            if(items instanceof Actions) {
                this.actions = items;
            } else {
                if(this.actions === undefined) {
                    this.actions = new Actions();
                }

                if (!Array.isArray(items)) {
                    items = [items];
                }

                items.forEach(item => {
                    const action = item instanceof Action ? item : new Action(item);
                    this.actions.add(action);
                });
            }
        }

        return this;
    }

    //public getLanguages(): Languages { return this.languages; }
    //public setLanguages(languages: Languages): this { this.languages = languages; return this; }
}

class Plugins {
    private menus: Menus;
    private actions: Actions;

    public constructor(items: Plugin | PluginType | Array<Plugin | PluginType>) {
        this.menus = new Menus();
        this.actions = new Actions();

        // Normalizza in array
        const arr = Array.isArray(items) ? items : [items];
        arr.forEach(item => {
            const plugin = item instanceof Plugin ? item : new Plugin(item);
            this.addMenu(plugin.getMenus());
            this.addAction(plugin.getActions());
            // I18n.languages.add(plugin.getLanguages()); // decommenta se serve
        });
    }

    public getMenus(): Menus { return this.menus; }
    public addMenu(items?: Menus | Menu | MenuType | Array<Menu | MenuType>): this {
        if (items !== undefined) {
            if (items instanceof Menus) {
                items.getAll().forEach(menu => this.menus.add(menu));
            } else if (Array.isArray(items)) {
                items.forEach(item => this.addMenu(item));
            } else {
                const menu = items instanceof Menu ? items : new Menu(items);
                this.menus.add(menu);
            }
        }
        return this;
    }

    public getActions(): Actions { return this.actions; }
    public addAction(items?: Actions | Action | ActionType | Array<Action | ActionType>): this {
        if (items !== undefined) {
            if (items instanceof Actions) {
                items.getAll().forEach(action => this.actions.add(action));
            } else if (Array.isArray(items)) {
                items.forEach(item => this.addAction(item));
            } else {
                const action = items instanceof Action ? items : new Action(items);
                this.actions.add(action);
            }
        }
        return this;
    }

    public async call(type: 'menu' | 'action', name: string, parent?: string) {
        switch (type) {
            case 'menu': return await this.getMenus().get(name)?.call(this.getMenus(), this.getActions(), );
            case 'action': return this.getActions().get(name)?.call(this.getMenus(), this.getActions(), parent);
        }
    } 
}

export { Plugin, Plugins, type PluginType };