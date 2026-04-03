import { PluginJson } from "./components/plugins";

const plugins: PluginJson[] = [
    {
        name: "default",
        menus: [
            {
                type: "choice",
                name: "main",
                values: [],
            },
        ],
        actions: [
            {
                type: "goto",
                name: "back",
                to: "main",
                global: true,
            },
            {
                type: "function",
                name: "exit",
                global: true,
                callback: async (): Promise<void> => {
                    console.log("Exiting...");
                    process.exit(0);
                },
            },
        ],
    },
    {
        name: "test",
        menus: [
            {
                type: "choice",
                name: "test1",
                parents: ["main"],
                values: ["a", "b", "c"],
            },
            {
                type: "choice",
                name: "test2",
                parents: ["test1"],
                values: ["d", "e", "f"],
            },
        ],
        actions: [
            //{
            //
            //}
        ],
    },
];

// console.log(JSON.stringify(plugins, null, 2));

Promise.resolve()
    .then(() => {
        console.log(JSON.stringify(plugins, null, 2));
    })
    .catch((err: unknown) => {
        console.error("Error:", err);
    });
