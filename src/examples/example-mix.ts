import { cli } from "@/main";

cli.addPlugin({
    name: "test1",
    menus: [
        {
            name: "submenu1",
            type: "choice",
            parents: ["main"],
            values: ["subaction1", "submenu2", "nickname", "features"],
        },
        {
            name: "submenu2",
            type: "choice",
            values: ["subaction2"],
        },
        {
            name: "nickname",
            type: "input",
            parents: ["submenu1"],
            value: "test",
            configs: {
                validate: (value): boolean => value.trim().length > 0,
                callback: async ({ menu, value, language, parent }): Promise<void> => {
                    menu.getLabels().getSuccess()?.print({ color: "green", language, append: value });
                    await cli.run("press-to-continue", parent);
                },
            },
        },
        {
            name: "features",
            type: "choice",
            parents: ["submenu1"],
            styles: {
                idle: {
                    prefix: "A ",
                    color: "blue",
                },
                hover: {
                    prefix: "B ",
                    color: "red",
                },
                selected: {
                    prefix: "C ",
                    color: "green",
                },
            },
            configs: {
                selectable: true,
                defaultValues: ["notifications"],
                callback: async ({ values, menu, parent }): Promise<void> => {
                    menu.getLabels()
                        .getSuccess()
                        ?.print({ color: "green", append: values.join(", ") });
                    await cli.run("press-to-continue", parent);
                },
            },
            values: [
                { value: "notifications", labels: { title: "test1.features.answer.notifications" }, multi: true },
                { value: "darkmode", labels: { title: "test1.features.answer.darkmode" }, multi: true },
                { value: "autosave", labels: { title: "test1.features.answer.autosave" }, multi: true },
                { value: "analytics", labels: { title: "test1.features.answer.analytics" }, multi: true },
            ],
        },
    ],
    actions: [
        {
            name: "action1",
            type: "function",
            styles: { idle: { color: "blue" } },
            callback: async (): Promise<void> => {
                console.log("Action 1 executed");
            },
            parents: ["main"],
        },
    ],
    translations: {
        "test1.action1.title": {
            en: "Action 1",
            it: "Azione 1",
            fr: "Action 1",
            de: "Aktion 1",
            es: "Acción 1",
            pl: "Akcja 1",
            ru: "Действие 1",
            cn: "操作 1",
            jp: "アクション 1",
            ar: "الإجراء 1",
        },
        "test1.submenu1.title": {
            en: "Submenu 1",
            it: "Sottomenu 1",
            fr: "Sous-menu 1",
            de: "Untermenü 1",
            es: "Submenú 1",
            pl: "Podmenu 1",
            ru: "Подменю 1",
            cn: "子菜单 1",
            jp: "サブメニュー 1",
            ar: "القائمة الفرعية 1",
        },
        "test1.nickname.question": {
            en: "What is your nickname?",
            it: "Qual è il tuo nickname?",
            fr: "Quel est votre pseudo ?",
            de: "Wie lautet dein Spitzname?",
            es: "¿Cuál es tu apodo?",
            pl: "Jaki jest twój pseudonim?",
            ru: "Какой у вас никнейм?",
            cn: "你的昵称是什么？",
            jp: "あなたのニックネームは何ですか？",
            ar: "ما هو لقبك؟",
        },
        "test1.nickname.placeholder": {
            en: "Enter your nickname...",
            it: "Inserisci il tuo nickname...",
            fr: "Entrez votre pseudo...",
            de: "Geben Sie Ihren Spitznamen ein...",
            es: "Ingrese su apodo...",
            pl: "Wprowadź swój pseudonim...",
            ru: "Введите ваш никнейм...",
            cn: "请输入您的昵称...",
            jp: "ニックネームを入力してください...",
            ar: "أدخل لقبك...",
        },
        "test1.nickname.error": {
            en: "Nickname cannot be empty",
            it: "Il nickname non può essere vuoto",
            fr: "Le pseudo ne peut pas être vide",
            de: "Der Spitzname darf nicht leer sein",
            es: "El apodo no puede estar vacío",
            pl: "Pseudonim nie może być pusty",
            ru: "Никнейм не может быть пустым",
            cn: "昵称不能为空",
            jp: "ニックネームは空にできません",
            ar: "لا يمكن أن يكون اللقب فارغًا",
        },
        "test1.nickname.success": {
            en: "Nickname set to",
            it: "Nickname impostato",
            fr: "Nickname défini sur ",
            de: "Nickname gesetzt auf",
            es: "Nickname establecido en",
            pl: "Pseudonim ustawiony na",
            ru: "Никнейм установлен на",
            cn: "昵称设置为",
            jp: "ニックネームが設定されました",
            ar: "تم تعيين اللقب إلى",
        },
        "test1.features.title": {
            en: "Features",
            it: "Funzionalità",
            fr: "Fonctionnalités",
            de: "Funktionen",
            es: "Funcionalidades",
            pl: "Funkcje",
            ru: "Функции",
            cn: "功能",
            jp: "機能",
            ar: "الميزات",
        },
        "test1.features.answer.notifications": {
            en: "Notifications",
            it: "Notifiche",
            fr: "Notifications",
            de: "Benachrichtigungen",
            es: "Notificaciones",
            pl: "Powiadomienia",
            ru: "Уведомления",
            cn: "通知",
            jp: "通知",
            ar: "الإشعارات",
        },
        "test1.features.question": {
            en: "Select the features to enable:",
            it: "Seleziona le funzionalità da abilitare:",
            fr: "Sélectionnez les fonctionnalités à activer :",
            de: "Wählen Sie die zu aktivierenden Funktionen:",
            es: "Seleccione las funcionalidades a habilitar:",
            pl: "Wybierz funkcje do włączenia:",
            ru: "Выберите функции для включения:",
            cn: "选择要启用的功能：",
            jp: "有効にする機能を選択してください：",
            ar: "حدد الميزات المراد تفعيلها:",
        },
        "test1.features.success": {
            en: "Features enabled:",
            it: "Funzionalità abilitate:",
            fr: "Fonctionnalités activées :",
            de: "Aktivierte Funktionen:",
            es: "Funcionalidades habilitadas:",
            pl: "Włączone funkcje:",
            ru: "Включены функции:",
            cn: "已启用功能：",
            jp: "有効な機能：",
            ar: "الميزات المفعّلة:",
        },
    },
}).addPlugin({
    name: "test2",
    actions: [
        {
            name: "msubmenu2",
            type: "goto",
            to: "submenu2",
            parents: ["main"],
        },
    ],
});

cli.run();
