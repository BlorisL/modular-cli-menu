import { Menu } from '@classes/Menu';
import { CustomAction } from '@interfaces/CustomAction';

export class MenuItem {
    id: string;
    translationKey: string;
    action?: CustomAction;
    submenu?: Menu;
    parentId?: string;
    navigation?: string;

    constructor(
        id: string,
        translationKey: string,
        action?: CustomAction,
        submenu?: Menu,
        parentId?: string,
        navigation?: string
    ) {
        this.id = id;
        this.translationKey = translationKey;
        this.action = action;
        this.submenu = submenu;
        this.parentId = parentId;
        this.navigation = navigation;
    }

    public getAction(): CustomAction | undefined {
        return this.action;
    }
}