import { it } from "node:test";
import { Cli } from "./components/cli";

const plugins = new Cli();

plugins
    .addPlugin({
        name: 'default',
        menus: [
            {
                name: 'main',
                type: 'choice',
                color: 'green',
                values: [
                ]
            }
        ],
        actions: [
            {
                name: 'back',
                type: 'goto',
                to: 'main',
                global: true
            },
            {
                name: 'exit',
                type: 'function',
                color: 'red',
                callback: async () => {
                    console.log(Cli.write('Exiting...', 'red'));
                    process.exit(0);
                },
                global: true
            },
        ],
        translations: {
            'default.main.question': {
                en: 'Please choose an option:',
                it: "Per favore scegli un'opzione:",
                fr: 'Veuillez choisir une option :',
                de: 'Bitte wählen Sie eine Option:',
                es: 'Por favor, elija una opción:',
                pl: 'Proszę wybrać opcję:',
                ru: 'Пожалуйста, выберите опцию:',
                cn: '请选择一个选项：',
                jp: 'オプションを選択してください：',
                ar: 'يرجى اختيار خيار:',
            }
        }
    })
    .addPlugin({
        name: 'translate',
        menus: []
    })
    .addPlugin({
        name: 'test1',
        menus: [
            {
                name: 'submenu1',
                type: 'choice',
                parents: ['main'],
                values: [
                    'subaction1',
                    'submenu2'
                ]
            },
            {
                name: 'submenu2',
                type: 'choice',
                values: [
                    'subaction2',
                ]
            }
        ],
        actions: [
            {
                name: 'action1',
                type: 'function',
                color: 'blue',
                callback: async () => {
                    console.log('Action 1 executed');
                },
                parents: ['main'],
            }
        ]
    })
    .addPlugin({
        name: 'test2',
        actions: [
            {
                name: 'msubmenu2',
                type: 'goto',
                to: 'submenu2',
                parents: ['main'],
            },
        ]
    })

plugins.run();