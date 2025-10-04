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
                name: "test1",
                parents: ["main"],
                values: ['a','b','c'],
            },
            {
                mode: "choices",
                name: "test2",
                parents: ["test1"],
                values: ['d','e','f'],
            }
        ],
        actions: [
            //{
//
            //}
        ]
    }
]);

plugins.print().then(() => {
    //console.log('Done');
}).catch(err => {
    console.error('Error:', err);
});