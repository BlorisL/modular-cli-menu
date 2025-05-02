import { Menu } from '@classes/Menu';
import { LanguageManager } from '@classes/LanguageManager';
import { debugLog, findParentMenu } from '@utils/functions';

export default async function back(
    mainMenu: Menu,
    languageManager: LanguageManager,
    currentMenu: Menu,
    menus: Map<string, Menu>
): Promise<void> {
    debugLog(`Executing back action for menu: ${currentMenu.getId()}`);
    const parentMenu = await findParentMenu(currentMenu, menus);
    debugLog(`Parent found for ${currentMenu.getId()}: ${parentMenu?.getId() || 'main'}`);
    if (parentMenu) {
        await parentMenu.display(menus, mainMenu);
    } else {
        await mainMenu.display(menus, mainMenu);
    }
}