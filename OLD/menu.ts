import select, { Separator } from '@inquirer/select';
import checkbox from '@inquirer/checkbox';
import { addPlugin, getPlugins } from './plugins';
import { actionExit, actionGoBack, loadEnv, waitForKeyPress, write } from './utility';
import { updateLanguages } from './languages';
import type { ActionsType, ActionType, MenuItemType, MenuType, PluginType } from "./types";
import { ColorName } from 'chalk';

let initializeMenu = false;

let actions: ActionsType = {
    ...actionExit(),
    ...actionGoBack(),
};

let menu: MenuType = {
    main: {
        name: 'main',
        choices: [
            'menu.action.exit'
        ]
    },
};

addPlugin({
    menu: {
        name: 'retry',
        color: 'green',
        choices: [
            'menu.retry.action.yes',
            'menu.action.back',
        ]
    },
    actions: {
        'menu.retry.action.yes': {
            name: 'menu.retry.action.yes',
            type: 'function',
            options: {
                message: {
                    color: 'blue',
                    text: 'menu.retry.action.yes.message'
                },
                callback: async (parent?: string) => {
                    await print(parent ?? 'main');
                }
            }
        },
    },
    languages: {
        en: {
            "menu.retry.question": "Invalid input value",
            //"menu.retry.action.yes.message": "Lingua italiana selezionata con successo",
            "menu.retry.action.yes.label": "Retry",
        },
        it: {
            "menu.retry.question": "Valore inserito non valido",
            //"menu.retry.action.yes.message": "Lingua italiana selezionata con successo",
            "menu.retry.action.yes.label": "Riprovare",
        }
    }
})

addPlugin({
    menu: {
        name: 'language',
        parent: 'main',
        color: 'green',
        choices: [
            'menu.language.action.it',
            'menu.language.action.en',
        ]
    },
    actions: {
        'menu.language.action.it': {
            name: 'menu.language.action.it',
            type: 'function',
            options: {
                message: {
                    color: 'green',
                    text: 'menu.language.action.it.message'
                },
                callback: async (parent?: string) => {
                    process.env.MENU_LANGUAGE = 'it';
                    await waitForKeyPress();
                    await print('main');
                }
            }
        },
        'menu.language.action.en': {
            name: 'menu.language.action.en',
            type: 'function',
            options: {
                message: {
                    color: 'green',
                    text: 'menu.language.action.en.message'
                },
                callback: async (parent?: string) => {
                    process.env.MENU_LANGUAGE = 'en';
                    await waitForKeyPress();
                    await print('main');
                }
            }
        }
    },
    languages: {
        en: {
            "menu.language.question": "Change language",
            "menu.language.action.it.message": "Lingua italiana selezionata con successo",
            "menu.language.action.en.message": "English language selected successfully",
            "menu.language.action.it.label": "Italian",
            "menu.language.action.en.label": "English"
        },
        it: {
            "menu.language.question": "Cambio lingua",
            "menu.language.action.it.message": "Lingua italiana selezionata con successo",
            "menu.language.action.en.message": "English language selected successfully",
            "menu.language.action.it.label": "Italiano",
            "menu.language.action.en.label": "Inglese"
        }
    }
})

async function init() {
    loadEnv();
    
    getPlugins().forEach((plugin: PluginType) => {
        menu[plugin.menu.name] = plugin.menu;
        actions = { ...actions, ...plugin.actions };
        if(plugin.menu.parent) {
            const parentChoices = menu[plugin.menu.parent].choices;
            parentChoices.splice(parentChoices.length - 1, 0, `menu.${plugin.menu.name}.question`);
        }
        if (plugin.languages) {
            const pluginLanguages: Record<string, Record<string, string>> = {};
            Object.entries(plugin.languages).forEach(([lang, translations]) => {
                pluginLanguages[lang] = { ...(pluginLanguages[lang] || {}), ...(translations as Record<string, string>) };
            });

            // Update the languages with plugin translations
            updateLanguages(pluginLanguages);
        }
    });
}

function getAction(action: string) {
    let label = '', color: ColorName | undefined = undefined;
    if(action.endsWith('.question')) {
        label = action;
        action = action.replace('.question', '').replace('menu.', '');
        color = menu[action]!.color;
    } else {
        label = `${action}.label`;
        color = actions[action].color;
    }
    return { name: write(label, color), value: action };
}

function getQuestion(item: MenuItemType, message?: string, color?: ColorName) {
    const exitIdx = item.choices.indexOf('menu.action.exit');
    const backIdx = item.choices.indexOf('menu.action.back');
    const langIdx = item.choices.indexOf('menu.language.question');

    const mainChoices = item.choices.filter(
        name => name !== 'menu.action.exit' && 
        name !== 'menu.action.back' && 
        name !== 'menu.language.question'
    );

    const orderedChoices: string[] = [
        ...mainChoices,
        'menu.separator',
        ...(backIdx !== -1 ? ['menu.action.back'] : []),
        ...(langIdx !== -1 ? ['menu.language.question'] : []),
        ...(exitIdx !== -1 ? ['menu.action.exit'] : [])
    ];

    return {
        ...item,
        value: item.name,
        message: write(message ?? `menu.${item.name}.question`, color ?? item?.color),
        choices: orderedChoices.flatMap((name, idx, arr) => {
            const result = [];
            if (name === 'menu.separator') {
                result.push(new Separator());
            } else {
                result.push(getAction(name));
            }
            return result;
        })
    }
}

async function action(
    selectedAction: string,
    options: {
        menu?: string,
        message?: string, 
        color?: ColorName
    } = {} 
) {
    const action = actions[selectedAction];
    const selectedMenu = options.menu ?? 'main';
    const message = options.message ?? undefined;
    const color = options.color ?? undefined;
    
    switch (action?.type) {
        case 'function':
            if(action.options?.message?.text) {
                console.log(write(
                    message ?? action.options.message.text, 
                    color ?? action.options.message?.color
                ));
            }
            if (action.options?.callback) {
                await action.options.callback(selectedMenu);
            }
            break;
        case 'goto':
            if(menu[selectedMenu].parent) {
                if (action.options?.callback) {
                    await action.options.callback(menu[selectedMenu].parent);
                } else {
                    await print(menu[selectedMenu].parent, { message, color });
                }
            } else {
                console.log(write(`menu.goto.target.notfound`, 'red'));
            }
            break;
        case 'input':
            if (action.options?.message) {
                const userInput = await waitForKeyPress({
                    message: message ?? action.options.message.text, 
                    color: color ?? action.options.message?.color,
                    default: action.options.default
                });
                
                if (action.options.callback) {
                    await action.options.callback(userInput, menu[selectedMenu]?.parent);
                }
            }
            break;
        case 'checkbox':
            if (action.options?.message) {
                const assetsAnswer = await checkbox({
                    message: write(
                        message ?? action.options.message.text, 
                        color ?? action.options.message?.color
                    ),
                    choices: action.options.answers.map((item) => ({
                        name: write(item.name, item.color),
                        value: item.value
                    }))
                });
                if (action.options.callback) {
                    await action.options.callback(assetsAnswer, menu[selectedMenu]?.parent);
                }
            }
            break;
        default:
            console.log(write(`menu.action.notfound`, 'red'));
            break;
    }
}

async function print(
    selectedMenu: string = 'main', 
    options: {
        action?: string,
        message?: string, 
        color?: ColorName
    } = {}
) {
    console.clear();

    if(!initializeMenu) {
        await init();
        initializeMenu = true;
    }

    if(options.action && options.action.length > 0 && actions[options.action]) {
        await action(options.action, { 
            menu: selectedMenu,
            message: options.message, 
            color: options.color
        });
    }
    else if(menu[selectedMenu]) {
        const answer: string = await select(getQuestion(menu[selectedMenu], options.message, options.color));
        if(menu[selectedMenu].choices.includes(answer)) {
            await action(answer, { menu: selectedMenu });
        } else if(menu[answer]) {
            await print(answer);
        }
    } else {
        console.log(write(`menu.notfound`, 'red'));
    }
}

async function addActionToMenu(action: string | ActionType, menuName: string = 'main') {
    if(typeof action === 'string') {
        action = actions[action];
    } else {
        if(!action.name) {
            throw new Error('Action must have a name property');
        }
        if(!action.type) {
            throw new Error('Action must have a type property');
        }
        actions[action.name] = action;
    }

    if(action && menu[menuName]) {
        const tmp = getAction(action.name);
        if(!menu[menuName].choices.includes(tmp.value)) {
            menu[menuName].choices.push(tmp.value);
        }
    }
}

export { 
    type PluginType,
    type ActionType,
    type ActionsType,
    type MenuItemType,
    type MenuType,
    updateLanguages,
    action,
    print,
    write,
    addPlugin,
    addActionToMenu,
    actionExit,
    actionGoBack,
    waitForKeyPress
}