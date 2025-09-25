import { Menu, MenuType } from "./item";
import { MenuInput, MenuInputType } from "./modes/input";
import { MenuChoices, MenuChoicesType } from "./modes/choices";
import { Collection } from "../Collection";

type MenusItemType = MenuInputType | MenuChoicesType;
type MenusType = Record<string, MenusItemType>;

class Menus extends Collection<Menu, MenusItemType> {
    public constructor(items: MenusType = {}) {
        super(items, (item: MenusItemType) => {
            switch(item.mode) {
                case MenuInput.MODE_NAME:
                    return new MenuInput(item as MenuInputType);
                case MenuChoices.MODE_NAME:
                    return new MenuChoices(item as MenuChoicesType);
                default:
                    throw new Error(`Unknown menu mode: ${(item as any).mode}`);
            }
        });
    }
}

export { 
    Menus, 
    type MenusType 
};