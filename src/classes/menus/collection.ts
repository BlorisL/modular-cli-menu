import { Menu, MenuType } from "./item";
import { MenuInput, MenuInputType } from "./modes/input";
import { MenuChoices, MenuChoicesType } from "./modes/choices";

type MenusItemType = MenuInputType | MenuChoicesType;
type MenusType = Record<string, MenusItemType>;

class Menus {
    protected items: Record<string, Menu> = {};

    public constructor(items: MenusType = {}) {
        Object.keys(items).forEach((key) => this.add(items[key]));
    }
    
    public add(item: MenusItemType): this { 
        let tmp: Menu;
        switch(item.mode) {
            case MenuInput.MODE_NAME:
                tmp = new MenuInput(item);
                break;
            case MenuChoices.MODE_NAME:
                tmp = new MenuChoices(item);
                break;
        }
        if(tmp !== undefined) {
            this.items[tmp.getName()] = tmp;
        }
        return this; 
    }

    public get(name: string): Menu | undefined { return this.items[name]; }

    public toObject(): MenusType {
        const obj: MenusType = {};
        Object.keys(this.items).forEach((key) => {
            const item = this.items[key];
            obj[key] = item.toObject();
        });
        return obj;
    }

    public toArray(): Menu[] {
        return Object.values(this.items).sort((a, b) => 
            (a.getIndex() ?? Infinity) - (b.getIndex() ?? Infinity)
        );
    }
}

export { 
    Menus, 
    type MenusType 
};