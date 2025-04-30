import { Menu } from '@classes/Menu';
import { LanguageManager } from '@classes/LanguageManager';

export default async function exit(
    _mainMenu: Menu,
    languageManager: LanguageManager,
    _currentMenu: Menu,
    _menus: Map<string, Menu>
): Promise<void> {
    console.log(languageManager.getTranslation('actions.exit'));
    process.exit(0);
}