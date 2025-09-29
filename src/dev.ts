import { Plugins } from "./classes/plugin";

const plugins = new Plugins([{
    name: "default",
    menus: [
        {
            mode: "choices",
            name: "main",
            values: ['1','2','3']
        }
    ]
}]);

plugins.getMenu()?.print().then(() => {
    //console.log('Done');
}).catch(err => {
    console.error('Error:', err);
});