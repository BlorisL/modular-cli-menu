import { PluginConfig } from "../../types";

export const additionalConfig: PluginConfig = {
    name: "additional",
    menus: {
        settings: {
            type: "choice",
            id: "settings",
            key: "label_settings",
            customActions: ["notifications", "advanced"],
            parent: "main",
            register: true,
        },
        advanced: {
            type: "choice",
            id: "advanced",
            key: "label_advanced",
            customActions: ["backup", "cleanup"],
            parent: "settings",
            register: true,
        },
        input: {
            type: "input",
            id: "input",
            key: "label_enter_name",
            onSubmit: (val: string) => {
                console.log(`👤 Hai inserito: ${val}`);
            },
            parent: "main",
            register: true,
        },
    },
    actions: {
        greeting: {
            type: "function",
            key: "label_greeting",
            fn: () => console.log("👋 Ciao!"),
            after: "none",
        },
        settings: {
            type: "goto",
            key: "label_settings",
            targetMenuId: "settings",
        },
        enter_name: {
            type: "goto",
            key: "label_enter_name",
            targetMenuId: "input",
        },
        notifications: {
            type: "function",
            key: "label_notifications",
            fn: () => console.log("🔔 Notifiche..."),
            after: "none",
        },
        advanced: {
            type: "goto",
            key: "label_advanced",
            targetMenuId: "advanced",
        },
        backup: {
            type: "function",
            key: "label_backup",
            fn: () => console.log("💾 Avvio backup..."),
            after: "none",
        },
        cleanup: {
            type: "function",
            key: "label_cleanup",
            fn: () => console.log("🧹 Pulizia completata!"),
            after: "none",
        },
    },
    translations: {
        it: {
            label_settings: "⚙️ Impostazioni",
            label_advanced: "🔧 Avanzate",
            label_notifications: "🔔 Notifiche",
            label_backup: "💾 Backup",
            label_cleanup: "🧹 Pulizia",
            label_enter_name: "✏️ Inserisci il tuo nome"
        },
        en: {
            label_settings: "⚙️ Settings",
            label_advanced: "🔧 Advanced",
            label_notifications: "🔔 Notifications",
            label_backup: "💾 Backup",
            label_cleanup: "🧹 Cleanup",
            label_enter_name: "✏️ Enter your name",
        },
        de: {
            label_settings: "⚙️ Einstellungen",
            label_advanced: "🔧 Erweitert",
            label_notifications: "🔔 Benachrichtigungen",
            label_backup: "💾 Sicherung",
            label_cleanup: "🧹 Bereinigung",
            label_enter_name: "✏️ Geben Sie Ihren Namen ein",
        },
    },
};