#!/usr/bin/env node

import { Action, Actions } from "./classes/Action";
import { I18n } from "./classes/Language";
import { Menus } from "./classes/Menu";
import { Modular } from "./classes/Modular";

const changeLanguage = async ({ 
    menus, 
    actions, 
    parent, 
    action 
}: {
    menus: Menus;
    actions: Actions;
    parent?: string;
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

const plugins = new Modular([
    {
        name: 'default',
        index: 0,
        menus: [
            {
                mode: 'choice',
                name: 'main',
                index: 0,
                //message: 'Menu Main',
                color: 'blue',
                actions: [
                    'test',
                    //'goback',
                    //'exit'
                ]
            },
            {
                mode: 'input',
                name: 'wait',
                index: 0,
                //message: 'Menu Main',
                color: 'blue',
            },
        ],
        actions: [
            {
                mode: 'goto',
                name: 'goback',
                color: 'blue',
                //message: 'action.exit.goback',
                //callback: async (args) => {
                //    return args.menus.get(args.parent ?? 'default');
                //}
                //index: 0
            },
            {
                mode: 'function',
                name: 'exit',
                color: 'red',
                //message: 'action.exit.message',
                callback: async (args) => {
                    return;
                }
                //index: 1
            },
            {
                mode: 'goto',
                name: 'test',
                to: 'test',
            }
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
                //message: 'Menu Main',
                color: 'blue',
                actions: () => I18n.languages.getCodes()
            }
        ],
        actions: [
            { mode: 'function', name: 'en', callback: changeLanguage },
            { mode: 'function', name: 'it', callback: changeLanguage },
            {
                mode: 'goto',
                name: 'language',
                color: 'magenta',
                to: 'language',
            },
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
    {
        name: 'test',
        menus: [
            {
                mode: 'choice',
                name: 'test',
                parent: 'main',
                //message: 'Menu Main',
                color: 'blue',
                actions: [
                   { value: 'uno', isMulti: true },
                    'due',
                   { value: 'due', isMulti: true },
                ]
            }
        ],
        actions: [
            { mode: 'function', name: 'uno', callback: async ({menus, actions, parent, action}) => console.log(1) },
            { mode: 'function', name: 'due', callback: async ({menus, actions, parent, action}) => console.log(2) },
            { mode: 'function', name: 'tre', callback: async ({menus, actions, parent, action}) => console.log(3) },
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
    }
]);

plugins.call({ type: 'menu', name: 'main'}).then(() => {
    //console.log('Done');
}).catch(err => {
    console.error('Error:', err);
});