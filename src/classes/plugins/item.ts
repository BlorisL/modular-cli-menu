import { ActionType } from "../actions/item";
import { Actions } from "../actions/collection";
import { LanguageType } from "../languages/item";
import { MenuType } from "../menus/item";
import { Menus } from "../menus/collection";
import { I18n } from "../languages/i18n";

type PluginType = {
    name: string;
    index?: number;
    menus?: Array<MenuType>;
    actions?: Array<ActionType>;
    languages?: Array<LanguageType>;
};

class Plugin {
    protected name: string;
    protected index?: number;
    protected menus: Menus;
    protected actions: Actions;

    public constructor(params: PluginType) {
        this.name = params.name;
        this.index = params.index ?? undefined;
        this.menus = new Menus();
        this.addMenu(params.menus);
        this.actions = new Actions();
        this.addAction(params.actions);
        I18n.languages.add(params.languages);
    }

    public getName(): string { return this.name; }
    public setName(name: string): void { this.name = name; }

    public getIndex(): number | undefined { return this.index; }
    public setIndex(index: number): void { this.index = index; }

    public getMenus(): Menus { return this.menus; }
    public addMenu(menus?: Array<MenuType>): this { 
        if(menus && menus.length > 0) {
            menus.forEach((menu) => this.menus.add(menu));
        }
        return this; 
    }

    public getActions(): Actions { return this.actions; }
    public addAction(actions?: Array<ActionType>): this { 
        if(actions && actions.length > 0) {
            actions.forEach((action) => this.actions.add(action));
        }
        return this; 
    }

    public toObject(): PluginType {
        return {
            name: this.getName(),
            index: this.getIndex(),
            menus: Object.values(this.getMenus().toObject()),
            actions: Object.values(this.getActions().toObject()),
            languages: Object.values(I18n.languages.toObject()),
        };
    }
}

export { 
    Plugin, 
    type PluginType 
};