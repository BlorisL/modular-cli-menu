import { Menu } from '@classes/Menu';
import { LanguageManager } from '@classes/LanguageManager';
import { waitForKeyPress } from '@utils/functions';

export default async function showInfo(
    _mainMenu: Menu,
    languageManager: LanguageManager,
    _currentMenu: Menu,
    _menus: Map<string, Menu>
): Promise<void> {
    console.log(languageManager.getTranslation('actions.show_info'));
    await waitForKeyPress(languageManager);
}