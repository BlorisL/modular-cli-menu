import { ChoiceMenu } from "./menus/ChoiceMenu";
import { FunctionAction } from "./actions/FunctionAction";
import { GotoAction } from "./actions/GoToAction";
import { ChangeLanguageAction } from "./features/language/ChangeLanguageAction";
import { Translation } from "./i18n/Translation";
import { InputMenu } from "./menus/InputMenu";

export class App {
    private mainMenu: ChoiceMenu;
    private settingsMenu: ChoiceMenu;
    private advancedMenu: ChoiceMenu;
    private inputMenu: InputMenu;

    constructor() {
        this.mainMenu = new ChoiceMenu("main", "label_main_menu");
        this.settingsMenu = new ChoiceMenu("settings", "label_settings");
        this.advancedMenu = new ChoiceMenu("advanced", "label_advanced");
        this.inputMenu = new InputMenu("input", "label_enter_name", (val) => {
            console.log(`👤 Hai inserito: ${val}`);
        });

        this.setupMenus();
    }

    private setupMenus() {
        // Main
        this.mainMenu.addAction(new FunctionAction("label_greeting", () => console.log("👋 Ciao!")));
        this.mainMenu.addAction(new GotoAction("label_settings", this.settingsMenu, this.mainMenu));
        this.mainMenu.addAction(new ChangeLanguageAction("label_change_language", this.mainMenu));
        this.mainMenu.addAction(new GotoAction("label_enter_name", this.inputMenu, this.mainMenu));

        // Settings
        this.settingsMenu.addAction(new FunctionAction("label_notifications", () => console.log("🔔 Notifiche...")));
        this.settingsMenu.addAction(new GotoAction("label_advanced", this.advancedMenu, this.settingsMenu));

        // Advanced
        this.advancedMenu.addAction(new FunctionAction("label_backup", () => console.log("💾 Avvio backup...")));
        this.advancedMenu.addAction(new FunctionAction("label_cleanup", () => console.log("🧹 Pulizia completata!")));
    }

    async start() {
        await this.mainMenu.render();
    }
}
