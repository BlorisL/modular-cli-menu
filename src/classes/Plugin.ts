import { PluginType } from "@/types/Plugin";
import { Action, Actions } from "./Action";
import { I18n } from "./Language";
import { Menus, Menu, MenuInput, MenuChoice } from "./Menu";
import { MenuType } from "@/types/Menu";
import { ActionType } from "@/types/Action";

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
                    let menu: Menu | undefined = undefined;
                    if (item instanceof Menu) {
                        menu = item;
                    } else {
                        // Istanzia la sottoclasse corretta in base al mode
                        if (item.mode === 'input') {
                            menu = new MenuInput(item as any);
                        } else if (item.mode === 'choice') {
                            menu = new MenuChoice(item as any);
                        }
                    }
                    if(menu) {
                        this.menus.add(menu);
                    }
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

export { Plugin };