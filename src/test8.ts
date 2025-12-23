import { Cli } from "./components/cli";
import { Translations } from "./components/translations";

const plugins = new Cli();

plugins
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
                name: 'language',
                type: 'choice',
                parents: ['main'],
                global: true,
                enableSelectedValues: {
                    prefix: '✓ ',
                },
                values: () => Translations.getLanguages().map(lang => ({
                    value: lang,
                    //selected: {
                    //    prefix: '✓ ',
                    //},
                    label: `default.language.answer.${lang}`
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
                    console.log(Cli.write('Exiting...', 'red'));
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
                    'submenu2'
                ]
            },
            {
                name: 'submenu2',
                type: 'choice',
                values: [
                    'subaction2',
                ]
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
        ]
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

plugins.run();