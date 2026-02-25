import { Cli } from "./components/cli";
import { Translations } from "./components/translations";

const cli = new Cli();

cli
    .addPlugin({
        name: 'default',
        menus: [
            {
                name: 'main',
                type: 'choice',
                color: 'green',
                values: [
                ]
            },
            {
                name: 'press-to-continue',
                type: 'input',
                value: '',
                clear: false,
                fastSubmit: true,
                callback: async ({ menu, parent }) => {
                    cli.run(parent ?? 'main');
                }
            },
            {
                name: 'language',
                type: 'choice',
                //parents: ['main'],
                global: true,
                configs: {
                    defaults: {
                        values: [Translations.getDefaultLanguage()],
                        callback: async ({ values, menu, language, parent }) => {
                            if (values.length > 0) {
                                Cli.write(menu.getSuccessLabel(language), 'green');
                                cli.run('press-to-continue', parent);
                            }
                        }
                    },
                    selected: {
                        prefix: '#',
                        //color: 'magenta'
                    },
                },
                values: (data) => Translations.getLanguages().map(lang => ({
                    value: lang,
                    selected: lang == 'fr' ? {
                        prefix: '✓ ',
                        color: 'red'
                    } : undefined,
                    label: data.menu.getAnswerName(lang)
                }))
            }
        ],
        actions: [
            {
                name: 'back',
                type: 'goto',
                to: 'main',
                global: true
            },
            {
                name: 'exit',
                type: 'function',
                color: 'red',
                callback: async () => {
                    Cli.write('Exiting...', 'red');
                    process.exit(0);
                },
                global: true
            },
        ],
        translations: {
            //'default.language'
            'default.main.question': {
                en: 'Please choose an option:',
                it: "Per favore scegli un'opzione:",
                fr: 'Veuillez choisir une option :',
                de: 'Bitte wählen Sie eine Option:',
                es: 'Por favor, elija una opción:',
                pl: 'Proszę wybrać opcję:',
                ru: 'Пожалуйста, выберите опцию:',
                cn: '请选择一个选项：',
                jp: 'オプションを選択してください：',
                ar: 'يرجى اختيار خيار:',
            },
            'default.press_to_continue.question': {
                en: 'Press Enter to continue...',
                it: 'Premi Invio per continuare...',
                fr: 'Appuyez sur Entrée pour continuer...',
                de: 'Drücken Sie die Eingabetaste, um fortzufahren...',
                es: 'Presione Enter para continuar...',
                pl: 'Naciśnij Enter, aby kontynuować...',
                ru: 'Нажмите Enter, чтобы продолжить...',
                cn: '按Enter键继续...',
                jp: '続行するにはEnterキーを押してください...',
                ar: 'اضغط Enter للمتابعة...',
            },
            'default.language.answer.en': {
                en: 'English',
                it: 'Inglese',
                fr: 'Anglais',
                de: 'Englisch',
                es: 'Inglés',
                pl: 'Angielski',
                ru: 'Английский',
                cn: '英语',
                jp: '英語',
                ar: 'الإنجليزية',
            },
            'default.language.answer.it': {
                en: 'Italian',
                it: 'Italiano',
                fr: 'Italien',
                de: 'Italienisch',
                es: 'Italiano',
                pl: 'Włoski',
                ru: 'Итальянский',
                cn: '意大利语',
                jp: 'イタリア語',
                ar: 'الإيطالية',
            },
            'default.language.answer.fr': {
                en: 'French',
                it: 'Francese',
                fr: 'Français',
                de: 'Französisch',
                es: 'Francés',
                pl: 'Francuski',
                ru: 'Французский',
                cn: '法语',
                jp: 'フランス語',
                ar: 'الفرنسية',
            },
            'default.language.answer.de': {
                en: 'German',
                it: 'Tedesco',
                fr: 'Allemand',
                de: 'Deutsch',
                es: 'Alemán',
                pl: 'Niemiecki',
                ru: 'Немецкий',
                cn: '德语',
                jp: 'ドイツ語',
                ar: 'الألمانية',
            },
            'default.language.answer.es': {
                en: 'Spanish',
                it: 'Spagnolo',
                fr: 'Espagnol',
                de: 'Spanisch',
                es: 'Español',
                pl: 'Hiszpański',
                ru: 'Испанский',
                cn: '西班牙语',
                jp: 'スペイン語',
                ar: 'الإسبانية',
            },
            'default.language.answer.pl': {
                en: 'Polish',
                it: 'Polacco',
                fr: 'Polonais',
                de: 'Polnisch',
                es: 'Polaco',
                pl: 'Polski',
                ru: 'Польский',
                cn: '波兰语',
                jp: 'ポーランド語',
                ar: 'البولندية',
            },
            'default.language.answer.ru': {
                en: 'Russian',
                it: 'Russo',
                fr: 'Russe',
                de: 'Russisch',
                es: 'Ruso',
                pl: 'Rosyjski',
                ru: 'Русский',
                cn: '俄语',
                jp: 'ロシア語',
                ar: 'الروسية',
            },
            'default.language.answer.cn': {
                en: 'Chinese',
                it: 'Cinese',
                fr: 'Chinois',
                de: 'Chinesisch',
                es: 'Chino',
                pl: 'Chiński',
                ru: 'Китайский',
                cn: '中文',
                jp: '中国語',
                ar: 'الصينية',
            },
            'default.language.answer.jp': {
                en: 'Japanese',
                it: 'Giapponese',
                fr: 'Japonais',
                de: 'Japanisch',
                es: 'Japonés',
                pl: 'Japoński',
                ru: 'Японский',
                cn: '日语',
                jp: '日本語',
                ar: 'اليابانية',
            },
            'default.language.answer.ar': {
                en: 'Arabic',
                it: 'Arabo',
                fr: 'Arabe',
                de: 'Arabisch',
                es: 'Árabe',
                pl: 'Arabski',
                ru: 'Арабский',
                cn: '阿拉伯语',
                jp: 'アラビア語',
                ar: 'العربية',
            },
            'default.language.success': {
                en: 'Language set successfully.',
                it: 'Lingua impostata con successo.',
                fr: 'Langue définie avec succès.',
                de: 'Sprache erfolgreich eingestellt.',
                es: 'Idioma establecido con éxito.',
                pl: 'Język został pomyślnie ustawiony.',
                ru: 'Язык успешно установлен.',
                cn: '语言设置成功。',
                jp: '言語が正常に設定されました。',
                ar: 'تم تعيين اللغة بنجاح.',
            }
        }
    })
    .addPlugin({
        name: 'test1',
        menus: [
            {
                name: 'submenu1',
                type: 'choice',
                parents: ['main'],
                values: [
                    'subaction1',
                    'submenu2',
                    'nickname',
                ]
            },
            {
                name: 'submenu2',
                type: 'choice',
                values: [
                    'subaction2',
                ]
            },
            {
                name: 'nickname',
                type: 'input',
                parents: ['submenu1'],
                //placeholder: 'Enter your nickname...',
                //value: 'test',
                validate: (value) => value.trim().length > 0 || 'Nickname cannot be empty',
                callback: async ({ menu, value, language, parent }) => {
                    //Cli.write(menu.getSuccessLabel(language), 'green');
                    //Cli.write(`Nickname set to: ${value}`, 'green');
                    cli.run('press-to-continue', parent);
                }
            }
        ],
        actions: [
            {
                name: 'action1',
                type: 'function',
                color: 'blue',
                callback: async () => {
                    console.log('Action 1 executed');
                },
                parents: ['main'],
            }
        ],
        translations: {
            'test1.nickname.placeholder': {
                en: 'Enter your nickname...',
                it: 'Inserisci il tuo nickname...',
                fr: 'Entrez votre pseudo...',
                de: 'Geben Sie Ihren Spitznamen ein...',
                es: 'Ingrese su apodo...',
                pl: 'Wprowadź swój pseudonim...',
                ru: 'Введите ваш никнейм...',
                cn: '请输入您的昵称...',
                jp: 'ニックネームを入力してください...',
                ar: 'أدخل لقبك...',
            },
            'test1.nickname.error': {
                en: 'Nickname cannot be empty',
                it: 'Il nickname non può essere vuoto',
                fr: 'Le pseudo ne peut pas être vide',
                de: 'Der Spitzname darf nicht leer sein',
                es: 'El apodo no puede estar vacío',
                pl: 'Pseudonim nie może być pusty',
                ru: 'Никнейм не может быть пустым',
                cn: '昵称不能为空',
                jp: 'ニックネームは空にできません',
                ar: 'لا يمكن أن يكون اللقب فارغًا',
            },
            'test1.nickname.success': {
                en: 'Nickname set to:',
                it: 'Nickname impostato:',
                fr: 'Nickname défini sur :',
                de: 'Nickname gesetzt auf:',
                es: 'Nickname establecido en:',
                pl: 'Pseudonim ustawiony na:',
                ru: 'Никнейм установлен на:',
                cn: '昵称设置为：',
                jp: 'ニックネームが設定されました：',
                ar: 'تم تعيين اللقب إلى:',
            }
        },
    })
    .addPlugin({
        name: 'test2',
        actions: [
            {
                name: 'msubmenu2',
                type: 'goto',
                to: 'submenu2',
                parents: ['main'],
            },
        ]
    })

cli.run();