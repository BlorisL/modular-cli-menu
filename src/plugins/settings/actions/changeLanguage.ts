import { Menu } from '@classes/Menu';
import { LanguageManager } from '@classes/LanguageManager';
import { promptWithBack } from '@utils/prompt';
import { debugLog } from '@/utils/functions';

export default async function changeLanguage(
    mainMenu: Menu,
    languageManager: LanguageManager,
    currentMenu: Menu,
    menus: Map<string, Menu>
): Promise<void> {
    debugLog(`Executing changeLanguage with currentMenu: ${currentMenu.getId()}`);
    const answers = await promptWithBack<{ lang: string }>(
        [
            {
                type: 'list',
                name: 'lang',
                message: languageManager.getTranslation('actions.select_language'),
                choices: [
                    { name: 'Italiano', value: 'it' },
                    { name: 'English', value: 'en' }
                ]
            }
        ],
        mainMenu,
        languageManager,
        currentMenu,
        menus
    );

    if (answers && answers.lang) {
        await languageManager.loadLanguage(answers.lang);
        console.log(languageManager.getTranslation('actions.language_changed'));
    }
}