import { Cli } from "./components/cli";
import { MenuFieldJsonValue } from "./components/menus";
import { Translations } from "./components/translations";

const cli = new Cli();

cli.addPlugin({
    name: "default",
    menus: [
        {
            name: "main",
            type: "choice",
            values: [],
        },
        {
            name: "press-to-continue",
            type: "input",
            value: "",
            configs: {
                clear: false,
                fastSubmit: true,
                callback: async ({ parent }): Promise<void> => {
                    await cli.run(parent ?? "main");
                },
            },
        },
    ],
    actions: [
        {
            name: "back",
            type: "goto",
            to: "main",
            global: true,
        },
        {
            name: "exit",
            type: "function",
            styles: {
                idle: { color: "red", italic: true },
            },
            callback: async (): Promise<void> => {
                Cli.write("Exiting...", "red");
                process.exit(0);
            },
            global: true,
        },
    ],
    translations: {
        "default.main.question": {
            en: "Please choose an option:",
            it: "Per favore scegli un'opzione:",
            fr: "Veuillez choisir une option :",
            de: "Bitte wählen Sie eine Option:",
            es: "Por favor, elija una opción:",
            pl: "Proszę wybrać opcję:",
            ru: "Пожалуйста, выберите опцию:",
            cn: "请选择一个选项：",
            jp: "オプションを選択してください：",
            ar: "يرجى اختيار خيار:",
        },
        "default.press_to_continue.question": {
            en: "Press Enter to continue...",
            it: "Premi Invio per continuare...",
            fr: "Appuyez sur Entrée pour continuer...",
            de: "Drücken Sie die Eingabetaste, um fortzufahren...",
            es: "Presione Enter para continuar...",
            pl: "Naciśnij Enter, aby kontynuować...",
            ru: "Нажмите Enter, чтобы продолжить...",
            cn: "按Enter键继续...",
            jp: "続行するにはEnterキーを押してください...",
            ar: "اضغط Enter للمتابعة...",
        },
    },
})
    .addPlugin({
        name: "translation",
        menus: [
            {
                name: "language",
                type: "choice",
                global: true,
                styles: {
                    selected: {
                        prefix: "#",
                        italic: true,
                        underline: true,
                    },
                },
                configs: {
                    selectable: true,
                    defaultValues: [Translations.getDefaultLanguage()!],
                    callback: async ({ values, menu, parent }): Promise<void> => {
                        if (values.length > 0) {
                            Translations.setCurrentLanguage(values[0]);
                            //Cli.write(menu.getSuccessLabel(Translations.getSelectedLanguage()), "green");
                            const message = menu.getLabels().getSuccess()?.getValue(Translations.getSelectedLanguage()) ?? "Language set successfully.";
                            if(message) {
                                Cli.write(message, "green");
                            }
                            await cli.run("press-to-continue", parent);
                        }
                    },
                },
                values: (data): MenuFieldJsonValue[] =>
                    Translations.getLanguages().map((lang) => ({
                        value: lang,
                        idle: lang == "de" ? { prefix: "*", color: "magenta" } : undefined,
                        hover: lang == "es" ? { prefix: "->", color: "yellow" } : undefined,
                        selected: lang == "fr" ? { prefix: "✓ ", color: "red" } : undefined,
                        label: data.menu.getAnswerName(lang),
                    })),
            },
        ],
        translations: {
            "translation.language.title": {
                en: "Change language",
                it: "Cambia lingua",
                fr: "Changer de langue",
                de: "Sprache ändern",
                es: "Cambiar idioma",
                pl: "Zmień język",
                ru: "Изменить язык",
                cn: "更改语言",
                jp: "言語を変更",
                ar: "تغيير اللغة",
            },
            "translation.language.answer.en": {
                en: "English",
                it: "Inglese",
                fr: "Anglais",
                de: "Englisch",
                es: "Inglés",
                pl: "Angielski",
                ru: "Английский",
                cn: "英语",
                jp: "英語",
                ar: "الإنجليزية",
            },
            "translation.language.answer.it": {
                en: "Italian",
                it: "Italiano",
                fr: "Italien",
                de: "Italienisch",
                es: "Italiano",
                pl: "Włoski",
                ru: "Итальянский",
                cn: "意大利语",
                jp: "イタリア語",
                ar: "الإيطالية",
            },
            "translation.language.answer.fr": {
                en: "French",
                it: "Francese",
                fr: "Français",
                de: "Französisch",
                es: "Francés",
                pl: "Francuski",
                ru: "Французский",
                cn: "法语",
                jp: "フランス語",
                ar: "الفرنسية",
            },
            "translation.language.answer.de": {
                en: "German",
                it: "Tedesco",
                fr: "Allemand",
                de: "Deutsch",
                es: "Alemán",
                pl: "Niemiecki",
                ru: "Немецкий",
                cn: "德语",
                jp: "ドイツ語",
                ar: "الألمانية",
            },
            "translation.language.answer.es": {
                en: "Spanish",
                it: "Spagnolo",
                fr: "Espagnol",
                de: "Spanisch",
                es: "Español",
                pl: "Hiszpański",
                ru: "Испанский",
                cn: "西班牙语",
                jp: "スペイン語",
                ar: "الإسبانية",
            },
            "translation.language.answer.pl": {
                en: "Polish",
                it: "Polacco",
                fr: "Polonais",
                de: "Polnisch",
                es: "Polaco",
                pl: "Polski",
                ru: "Польский",
                cn: "波兰语",
                jp: "ポーランド語",
                ar: "البولندية",
            },
            "translation.language.answer.ru": {
                en: "Russian",
                it: "Russo",
                fr: "Russe",
                de: "Russisch",
                es: "Ruso",
                pl: "Rosyjski",
                ru: "Русский",
                cn: "俄语",
                jp: "ロシア語",
                ar: "الروسية",
            },
            "translation.language.answer.cn": {
                en: "Chinese",
                it: "Cinese",
                fr: "Chinois",
                de: "Chinesisch",
                es: "Chino",
                pl: "Chiński",
                ru: "Китайский",
                cn: "中文",
                jp: "中国語",
                ar: "الصينية",
            },
            "translation.language.answer.jp": {
                en: "Japanese",
                it: "Giapponese",
                fr: "Japonais",
                de: "Japanisch",
                es: "Japonés",
                pl: "Japoński",
                ru: "Японский",
                cn: "日语",
                jp: "日本語",
                ar: "اليابانية",
            },
            "translation.language.answer.ar": {
                en: "Arabic",
                it: "Arabo",
                fr: "Arabe",
                de: "Arabisch",
                es: "Árabe",
                pl: "Arabski",
                ru: "Арабский",
                cn: "阿拉伯语",
                jp: "アラビア語",
                ar: "العربية",
            },
            "translation.language.success": {
                en: "Language set successfully.",
                it: "Lingua impostata con successo.",
                fr: "Langue définie avec succès.",
                de: "Sprache erfolgreich eingestellt.",
                es: "Idioma establecido con éxito.",
                pl: "Język został pomyślnie ustawiony.",
                ru: "Язык успешно установлен.",
                cn: "语言设置成功。",
                jp: "言語が正常に設定されました。",
                ar: "تم تعيين اللغة بنجاح.",
            },
        },
    })
    .addPlugin({
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
                        //Cli.write(`${menu.getSuccessLabel(language)}: ${value}`, "green");
                        Cli.write(`${menu.getLabels().getSuccess()?.getValue(language)}: ${value}`, "green");
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
                        //Cli.write(`${menu.getSuccessLabel()} ${values.join(", ")}`, "green");
                        Cli.write(`${menu.getLabels().getSuccess()?.getValue()} ${values.join(", ")}`, "green");
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
    })
    .addPlugin({
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
