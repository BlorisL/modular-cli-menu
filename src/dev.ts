import { Plugins } from "./classes/plugin";

const plugins = new Plugins([
    {
        name: "default",
        menus: [
            {
                mode: "choices",
                name: "main",
                values: []
            }
        ],
        actions: [
            {
                mode: "goto",
                name: "back",
                global: true,
            },
            {
                mode: "function",
                name: "exit",
                global: true,
                callback: async () => {
                    console.log('Exiting...');
                    process.exit(0);
                }
            }
        ]
    },
    {
        name: "test",
        menus: [
            {
                mode: "choices",
                name: "test",
                parent: "main",
                values: ['a','b','c'],
            }
        ]
    }
]);

plugins.print().then(() => {
    //console.log('Done');
}).catch(err => {
    console.error('Error:', err);
});