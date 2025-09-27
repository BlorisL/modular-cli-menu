import { ChoiceMenu } from "./menus/ChoiceMenu";
import { InputMenu } from "./menus/InputMenu";
import { DefaultPlugin } from "./plugins/default/DefaultPlugin";
import { LanguagePlugin } from "./plugins/language/LanguagePlugin";
import { Plugin } from "./types";

export class App {
    public mainMenu: ChoiceMenu;
    public settingsMenu: ChoiceMenu;
    public advancedMenu: ChoiceMenu;
    public inputMenu: InputMenu;

    constructor() {
        this.loadPlugins();
    }

    private loadPlugins() {
        const plugins: Plugin[] = [
            new DefaultPlugin(),
            new LanguagePlugin(),
        ];

        plugins.forEach(plugin => plugin.setup(this));
    }

    async start() {
        await this.mainMenu.render();
    }
}