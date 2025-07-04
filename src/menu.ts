import select, { Separator } from '@inquirer/select';
import checkbox from '@inquirer/checkbox';
import { addPlugin, getPlugins } from './plugins';
import { actionExit, actionGoBack, loadEnv, waitForKeyPress, write } from './utility';
import { updateLanguages } from './languages';
import type { ActionsType, ActionType, MenuItemType, MenuType, PluginType } from "./types";

let initializeMenu = false;

let actions: ActionsType = {
    ...actionExit(),
    ...actionGoBack(),
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
                print('main');
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
                print('main');
            }
        }
    }
};

let menu: MenuType = {
    main: {
        name: 'main',
        choices: [
            'menu.language.question',
            'menu.action.exit'
        ]
    },
    language: {
        name: 'language',
        parent: 'main',
        choices: [
            'menu.language.action.it',
            'menu.language.action.en',
            'menu.action.back',
            'menu.action.exit'
        ]
    }
};

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
    let label = '';
    if(action.endsWith('.question')) {
        label = action;
        action = action.replace('.question', '').replace('menu.', '');
    } else {
        label = `${action}.label`;
    }
    return { name: write(label, actions[action]?.color), value: action };
}

function getQuestion(item: MenuItemType) {
    return {
        ...item,
        value: item.name,
        message: write(`menu.${item.name}.question`, item?.color),
        choices: item.choices.flatMap(name => {
            const result = [];
            if(name == 'menu.action.exit' || name == 'menu.action.back') {
                result.push(new Separator());
            }
            result.push(getAction(name));

            return result;
        })
    }
}

async function action(selectedAction: string, selectedMenu: string = 'main') {
    const action = actions[selectedAction];
    switch (action?.type) {
        case 'function':
            if(action.options?.message?.text) {
                console.log(write(action.options.message.text, action.options.message?.color));
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
                    print(menu[selectedMenu].parent);
                }
            } else {
                console.log(write(`menu.goto.target.notfound`, 'red'));
            }
            break;
        case 'input':
            if (action.options?.message) {
                const userInput = await waitForKeyPress({
                    message: action.options.message.text, 
                    color: action.options.message?.color,
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
                    message: write(action.options.message.text, action.options.message?.color),
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

async function print(selectedMenu: string = 'main') {
    console.clear();

    if(!initializeMenu) {
        await init();
        initializeMenu = true;
    }

    if(menu[selectedMenu]) {
        const answer: string = await select(getQuestion(menu[selectedMenu]));
        if(menu[selectedMenu].choices.includes(answer)) {
            action(answer, selectedMenu);
        } else if(menu[answer]) {
            print(answer);
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