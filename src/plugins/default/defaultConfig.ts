import { PluginConfig } from "../../types";

export const defaultConfig: PluginConfig = {
    name: "default",
    menus: {
        main: {
            type: "choice",
            id: "main",
            key: "label_main_menu",
            customActions: [],
            register: true,
        },
    },
    actions: {},
    translations: {
        it: {
            label_main_menu: "📌 Menu principale",
            label_back: "↩️ Torna indietro",
            label_exit: "❌ Esci",
            label_greeting: "👋 Saluta"
        },
        en: {
            label_main_menu: "📌 Main Menu",
            label_back: "↩️ Back",
            label_exit: "❌ Exit",
            label_greeting: "👋 Greet"
        },
        de: {
            label_main_menu: "📌 Hauptmenü",
            label_back: "↩️ Zurück",
            label_exit: "❌ Beenden",
            label_greeting: "👋 Grüße"
        }
    }
};