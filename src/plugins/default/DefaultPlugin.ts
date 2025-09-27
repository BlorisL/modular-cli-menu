// plugins/default/DefaultPlugin.ts

import { Plugin } from "../../types";
import { App } from "../../App";
import { ChoiceMenu } from "../../menus/ChoiceMenu";
import { InputMenu } from "../../menus/InputMenu";
import { FunctionAction } from "../../actions/FunctionAction";
import { GotoAction } from "../../actions/GoToAction";

export class DefaultPlugin implements Plugin {
    setup(app: App): void {
        app.mainMenu = new ChoiceMenu("main", "label_main_menu");
        app.settingsMenu = new ChoiceMenu("settings", "label_settings");
        app.advancedMenu = new ChoiceMenu("advanced", "label_advanced");
        app.inputMenu = new InputMenu("input", "label_enter_name", (val) => {
            console.log(`👤 Hai inserito: ${val}`);
        });

        // Main
        app.mainMenu.addAction(new FunctionAction("label_greeting", () => console.log("👋 Ciao!")));
        app.mainMenu.addAction(new GotoAction("label_settings", app.settingsMenu, app.mainMenu));
        app.mainMenu.addAction(new GotoAction("label_enter_name", app.inputMenu, app.mainMenu));

        // Settings
        app.settingsMenu.addAction(new FunctionAction("label_notifications", () => console.log("🔔 Notifiche...")));
        app.settingsMenu.addAction(new GotoAction("label_advanced", app.advancedMenu, app.settingsMenu));

        // Advanced
        app.advancedMenu.addAction(new FunctionAction("label_backup", () => console.log("💾 Avvio backup...")));
        app.advancedMenu.addAction(new FunctionAction("label_cleanup", () => console.log("🧹 Pulizia completata!")));
    }
}