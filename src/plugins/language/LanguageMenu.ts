// plugins/language/LanguageMenu.ts

import { ChoiceMenu } from "../../menus/ChoiceMenu";
import { Translation } from "../../i18n/Translation";
import { Menu } from "../../menus/Menu";
import { FunctionAction } from "../../actions/FunctionAction";

export class LanguageMenu extends ChoiceMenu {
    constructor() {
        super("language", "🌐 Select language");

        this.addAction(new FunctionAction("🇮🇹 Italiano", async () => {
            Translation.setLocale("it");
            console.log("Lingua cambiata in Italiano");
            if (this.parent && this.parent instanceof Menu) {
                await this.parent.render();
            }
        }));

        this.addAction(new FunctionAction("🇬🇧 English", async () => {
            Translation.setLocale("en");
            console.log("Language switched to English");
            if (this.parent && this.parent instanceof Menu) {
                await this.parent.render();
            }
        }));

        this.addAction(new FunctionAction("🇩🇪 Deutsch", async () => {
            Translation.setLocale("de");
            console.log("Sprache auf Deutsch geändert");
            if (this.parent && this.parent instanceof Menu) {
                await this.parent.render();
            }
        }));
    }
}