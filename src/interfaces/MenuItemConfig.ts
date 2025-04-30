export interface MenuItemConfig {
    id: string;
    translationKey: string;
    pluginName?: string;
    parentId?: string;
    actionId?: string;
    submenu?: string[];
    navigation?: 'waitAndContinue' | 'previous' | `specific:${string}` | 'home';
}