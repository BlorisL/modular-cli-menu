import { Cli } from "@/components/cli";
import { MenuFieldJsonValue } from "@/components/menus";
import { Translations } from "@/components/translations";

const cli = new Cli();

const write = Cli.write;

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
            index: -9997,
        },
        {
            name: "exit",
            type: "function",
            index: -9999,
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
        "default.exit.title": {
            en: "Exit",
            it: "Esci",
            fr: "Quitter",
            de: "Beenden",
            es: "Salir",
            pl: "Wyjście",
            ru: "Выход",
            cn: "退出",
            jp: "終了",
            ar: "خروج",
        },
        "default.back.title": {
            en: "Go Back",
            it: "Torna Indietro",
            fr: "Retourner",
            de: "Zurückgehen",
            es: "Volver",
            pl: "Wróć",
            ru: "Назад",
            cn: "返回",
            jp: "戻る",
            ar: "العودة",
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
}).addPlugin({
    name: "translation",
    menus: [
        {
            name: "language",
            type: "choice",
            global: true,
            index: -9998,
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
                        menu.getLabels()
                            .getSuccess()
                            ?.print({ color: "green", language: Translations.getSelectedLanguage() });
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
                    labels: { title: data.menu.getLabels().getAnswer(lang)?.getName() },
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
});

export { cli, write };
