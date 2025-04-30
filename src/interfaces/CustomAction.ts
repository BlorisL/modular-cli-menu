import { Menu } from '@classes/Menu';
import { LanguageManager } from '@classes/LanguageManager';

export type CustomAction = (
    mainMenu: Menu,
    languageManager: LanguageManager,
    currentMenu: Menu,
    menus: Map<string, Menu>
) => Promise<void>;