import { PluginConfig } from "../../types";
import { Translation } from "../../classes/i18n/Translation";

export const languageConfig: PluginConfig = {
    name: "language",
    menus: {
        language: {
            type: "choice",
            id: "language",
            key: "🌐 Select language",
            customActions: ["it", "en", "de"],
            register: false,
        },
    },
    actions: {
        it: {
            type: "function",
            key: "🇮🇹 Italiano",
            fn: () => {
                Translation.setLocale("it");
                console.log("Lingua cambiata in Italiano");
            },
            after: "back",
        },
        en: {
            type: "function",
            key: "🇬🇧 English",
            fn: () => {
                Translation.setLocale("en");
                console.log("Language switched to English");
            },
            after: "back",
        },
        de: {
            type: "function",
            key: "🇩🇪 Deutsch",
            fn: () => {
                Translation.setLocale("de");
                console.log("Sprache auf Deutsch geändert");
            },
            after: "back",
        },
    },
    globalGoto: {
        label: "label_change_language",
        targetMenuId: "language",
    },
    translations: {
        it: {
            label_change_language: "🌐 Cambia lingua",
        },
        en: {
            label_change_language: "🌐 Change Language",
        },
        de: {
            label_change_language: "🌐 Sprache ändern",
        },
    },
};