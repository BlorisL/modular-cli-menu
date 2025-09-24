#!/usr/bin/env node

import { Action, Actions } from "./classes/Action";
import { I18n } from "./classes/languages/item";
import { Menus } from "./classes/Menu";
import { Modular } from "./classes/Modular";

const changeLanguage = async ({ 
    menus, 
    actions, 
    action 
}: {
    menus: Menus;
    actions: Actions;
    action: Action;
}) => {
    let menu;
    try {
        I18n.setSelectedLanguage(action.getName());
        menu = menus.getLastMenuOpened();

        console.log(I18n.getTranslation('menu.language.success', 'green'));
        await menus.get('wait')?.call({ menus,  actions });
    } catch (error) {
        I18n.getTranslation('menu.language.error', 'red');
        menu = menus.get('main');
    }

    return await menu!.call({
        menus, 
        actions, 
    });
};

const modular = new Modular([
    {
        name: 'default',
        index: 0,
        menus: [
            {
                mode: 'choice',
                name: 'main',
                index: 0,
                color: 'blue',
                actions: [
                ]
            },
            {
                mode: 'input',
                name: 'wait',
                index: 0,
                color: 'blue',
            },
        ],
        actions: [
            {
                mode: 'goto',
                name: 'goback',
                color: 'blue',
            },
            {
                mode: 'function',
                name: 'exit',
                color: 'red',
                options: {
                    callback: async () => {
                        return;
                    }
                }
            },
        ],
        languages: {
            en: {
                'menu.main.question': 'Main Menu',
                'action.exit.label': 'Exit',
                'action.goback.label': 'Back',
                'menu.wait.question': 'Press any key to continue...',
            },
            it: {
                'menu.main.question': 'Menu Principale',
                'action.exit.label': 'Esci',
                'action.goback.label': 'Torna indietro',
                'menu.wait.question': 'Premi un tasto per continuare...',
            }
        }
    },
    {
        name: 'lang',
        index: 0,
        menus: [
            {
                mode: 'choice',
                name: 'language',
                parent: 'main',
                color: 'blue',
                actions: () => I18n.languages.getCodes()
            }
        ],
        actions: [
            { mode: 'function', name: 'en', options: { callback: changeLanguage } },
            { mode: 'function', name: 'it', options: { callback: changeLanguage } },
            { mode: 'goto', name: 'language', color: 'magenta', options: { to: 'language', } },
        ],
        languages: {
            en: {
                'action.language.label': 'Change language',
                'menu.language.question': 'Select the language to use',
                'action.it.label': 'Italian',
                'action.en.label': 'English',
                'menu.language.success': 'Language changed successfully',
            },
            it: {
                'action.language.label': 'Cambia lingua',
                'menu.language.question': 'Seleziona la lingua da utilizzare',
                'action.it.label': 'Italiano',
                'action.en.label': 'Inglese',
                'menu.language.success': 'Lingua cambiata con successo',
                'menu.language.error': 'Errore durante il cambio della lingua',
            }
        }
    },
]);

export {
    modular, 
    Modular, Menus, Actions, Action, I18n
};