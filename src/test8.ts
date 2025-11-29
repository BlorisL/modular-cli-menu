import { Terminal } from "./components/terminal";

const plugins = new Terminal();

plugins
    .addPlugin({
        name: 'default',
        menus: [
            {
                name: 'main',
                type: 'choice',
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
                callback: async () => {
                    console.log('Exiting...');
                    process.exit(0);
                },
                global: true
            },
        ]
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