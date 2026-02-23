import { Cli } from "../components/cli";
import { Translations } from "../components/translations";
import { MenuChoice, MenuInput } from "../components/menus";
import { ActionGoto, ActionFunction } from "../components/actions";
import { PluginJson } from "../components/plugins";

// ─── Output helpers ───────────────────────────────────────────────────────────
const GREEN  = '\x1b[32m';
const RED    = '\x1b[31m';
const YELLOW = '\x1b[33m';
const BOLD   = '\x1b[1m';
const RESET  = '\x1b[0m';

let passed = 0;
let failed = 0;

function assert(condition: boolean, description: string, detail?: string) {
    if (condition) {
        console.log(`  ${GREEN}✓${RESET} ${description}`);
        passed++;
    } else {
        console.log(`  ${RED}✗${RESET} ${description}`);
        if (detail) console.log(`    ${YELLOW}→ ${detail}${RESET}`);
        failed++;
    }
}

function section(title: string) {
    console.log(`\n${BOLD}${title}${RESET}`);
}

// ─── Configurazione plugin (identica a test8.ts) ──────────────────────────────
// Qui va replicata la stessa struttura di plugin dichiarata in test8.ts.
// I test vengono derivati automaticamente da questa configurazione.
const plugins: PluginJson[] = [
    {
        name: 'default',
        menus: [
            {
                name: 'main',
                type: 'choice',
                color: 'green',
                values: []
            },
            {
                name: 'language',
                type: 'choice',
                global: true,
                configs: {
                    defaults: {
                        values: [Translations.getDefaultLanguage()],
                        callback: async (data) => {
                            if (data.values.length > 0) {
                                setTimeout(() => cli.trigger(data.menu, 'back'), 3000);
                            }
                        }
                    },
                    selected: { prefix: '#' },
                },
                values: (data) => Translations.getLanguages().map(lang => ({
                    value: lang,
                    selected: lang == 'fr' ? { prefix: '✓ ', color: 'red' as const } : undefined,
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
                callback: async () => process.exit(0),
                global: true
            },
        ],
        translations: {}
    },
    {
        name: 'test1',
        menus: [
            {
                name: 'submenu1',
                type: 'choice',
                parents: ['main'],
                values: ['subaction1', 'submenu2', 'nickname']
            },
            {
                name: 'submenu2',
                type: 'choice',
                values: ['subaction2']
            },
            {
                name: 'nickname',
                type: 'input',
                parents: ['submenu1'],
                placeholder: 'Enter your nickname...',
                validate: (value: string) => value.trim().length > 0 || 'Nickname cannot be empty',
                callback: async () => {}
            }
        ],
        actions: [
            {
                name: 'action1',
                type: 'function',
                color: 'blue',
                callback: async () => console.log('Action 1 executed'),
                parents: ['main'],
            }
        ]
    },
    {
        name: 'test2',
        actions: [
            {
                name: 'msubmenu2',
                type: 'goto',
                to: 'submenu2',
                parents: ['main'],
            },
        ]
    }
];

// ─── Costruzione CLI ──────────────────────────────────────────────────────────
const cli = new Cli();
plugins.forEach(p => cli.addPlugin(p));

// ─── Helpers per i test ───────────────────────────────────────────────────────

/** Restituisce il back_ ActionGoto di un menu leggendolo dalle sue values. */
function getBack(menuName: string): ActionGoto | undefined {
    const menu = cli.getMenu(menuName) as MenuChoice | undefined;
    return menu ? (cli as any).getActionTypeBack(menu) : undefined;
}

/**
 * Simula il render di un menu con un dato parent, replicando la logica
 * di costruzione del back_ da cli.run(), senza prompt interattivi.
 */
function simulateRender(menuName: string, parentName?: string) {
    const menu = cli.getMenu(menuName) as MenuChoice | undefined;
    if (!menu || menuName === 'main') return;
    const existing = getBack(menuName);
    if (existing) {
        existing.setTo(parentName ?? 'main');
    } else {
        const backTemplate = cli.getAction('back') as ActionGoto;
        if (backTemplate) {
            const backAction = new (backTemplate.constructor as any)(backTemplate.toJson())
                .setName(`back_${menuName}`)
                .setTo(parentName ?? 'main');
            menu.addValue(backAction);
        }
    }
}

/**
 * Ricava la lista flat di tutti i menu/actions staticamente dichiarati
 * nei plugin, con il relativo plugin di appartenenza.
 */
function flatMenus() {
    return plugins.flatMap(p =>
        (p.menus ?? []).map(m => ({ ...m, pluginName: p.name }))
    );
}
function flatActions() {
    return plugins.flatMap(p =>
        (p.actions ?? []).map(a => ({ ...a, pluginName: p.name }))
    );
}

// ─── SUITE 1: Menus registrati ────────────────────────────────────────────────
section('SUITE 1 — Menus registrati');

for (const m of flatMenus()) {
    assert(!!cli.getMenu(m.name), `menu "${m.name}" registrato`);
}

// ─── SUITE 2: Actions registrate ─────────────────────────────────────────────
section('SUITE 2 — Actions registrate');

for (const a of flatActions()) {
    assert(!!cli.getAction(a.name), `action "${a.name}" registrata`);
}

// ─── SUITE 3: Plugin assegnati ────────────────────────────────────────────────
section('SUITE 3 — Plugin assegnati');

for (const m of flatMenus()) {
    assert(
        cli.getMenu(m.name)?.getPlugin() === m.pluginName,
        `menu "${m.name}" → plugin "${m.pluginName}"`,
        `trovato: ${cli.getMenu(m.name)?.getPlugin()}`
    );
}
for (const a of flatActions()) {
    assert(
        cli.getAction(a.name)?.getPlugin() === a.pluginName,
        `action "${a.name}" → plugin "${a.pluginName}"`,
        `trovato: ${cli.getAction(a.name)?.getPlugin()}`
    );
}

// ─── SUITE 4: Global flag ─────────────────────────────────────────────────────
section('SUITE 4 — Global flag');

for (const m of flatMenus()) {
    const isGlobal = m.global === true;
    assert(
        cli.getMenu(m.name)?.isGlobal() === isGlobal,
        `menu "${m.name}" isGlobal === ${isGlobal}`
    );
}
for (const a of flatActions()) {
    const isGlobal = a.global === true;
    assert(
        cli.getAction(a.name)?.isGlobal() === isGlobal,
        `action "${a.name}" isGlobal === ${isGlobal}`
    );
}

// ─── SUITE 5: Tipo delle actions ──────────────────────────────────────────────
section('SUITE 5 — Tipo delle actions');

for (const a of flatActions()) {
    const instance = cli.getAction(a.name);
    if (a.type === 'goto') {
        assert(instance instanceof ActionGoto,     `action "${a.name}" è ActionGoto`);
        assert(
            (instance as ActionGoto).getTo() === (a as any).to,
            `action "${a.name}".to === "${(a as any).to}"`,
            `trovato: ${(instance as ActionGoto).getTo()}`
        );
    } else {
        assert(instance instanceof ActionFunction, `action "${a.name}" è ActionFunction`);
    }
}

// ─── SUITE 6: Colori ──────────────────────────────────────────────────────────
section('SUITE 6 — Colori');

for (const m of flatMenus()) {
    if ((m as any).color) {
        assert(
            cli.getMenu(m.name)?.getColor() === (m as any).color,
            `menu "${m.name}".color === "${(m as any).color}"`,
            `trovato: ${cli.getMenu(m.name)?.getColor()}`
        );
    }
}
for (const a of flatActions()) {
    if ((a as any).color) {
        assert(
            cli.getAction(a.name)?.getColor() === (a as any).color,
            `action "${a.name}".color === "${(a as any).color}"`,
            `trovato: ${cli.getAction(a.name)?.getColor()}`
        );
    }
}

// ─── SUITE 7: Parents dichiarati ─────────────────────────────────────────────
section('SUITE 7 — Parents dichiarati');

for (const m of flatMenus()) {
    const declaredParents = m.parents ?? [];
    const actualParents = cli.getMenu(m.name)?.getParents() ?? [];
    if (declaredParents.length > 0) {
        for (const p of declaredParents) {
            assert(
                actualParents.includes(p),
                `menu "${m.name}" ha parent "${p}"`
            );
        }
    } else {
        assert(
            actualParents.length === 0,
            `menu "${m.name}" non ha parents dichiarati`,
            `trovati: ${actualParents.join(', ')}`
        );
    }
}
for (const a of flatActions()) {
    const declaredParents = a.parents ?? [];
    const actualParents = cli.getAction(a.name)?.getParents() ?? [];
    if (declaredParents.length > 0) {
        for (const p of declaredParents) {
            assert(
                actualParents.includes(p),
                `action "${a.name}" ha parent "${p}"`
            );
        }
    } else {
        assert(
            actualParents.length === 0,
            `action "${a.name}" non ha parents dichiarati`,
            `trovati: ${actualParents.join(', ')}`
        );
    }
}

// ─── SUITE 8: Values iniettati via parents (load) ─────────────────────────────
section('SUITE 8 — Values iniettati dai parents');

for (const m of flatMenus()) {
    const declaredParents = m.parents ?? [];
    for (const parentName of declaredParents) {
        const parentMenu = cli.getMenu(parentName) as MenuChoice | undefined;
        assert(
            !!parentMenu?.getValue(m.name),
            `menu "${m.name}" è nei values di "${parentName}"`
        );
    }
}
for (const a of flatActions()) {
    const declaredParents = a.parents ?? [];
    for (const parentName of declaredParents) {
        const parentMenu = cli.getMenu(parentName) as MenuChoice | undefined;
        assert(
            !!parentMenu?.getValue(a.name),
            `action "${a.name}" è nei values di "${parentName}"`
        );
    }
}

// ─── SUITE 9: Values statici dichiarati nel menu ──────────────────────────────
section('SUITE 9 — Values statici dichiarati');

for (const m of flatMenus()) {
    const rawValues = (m as any).values;
    if (!rawValues || typeof rawValues === 'function') continue;
    const menu = cli.getMenu(m.name);
    if (!(menu instanceof MenuChoice)) continue;
    for (const v of rawValues) {
        const valueName = typeof v === 'string' ? v : v.value;
        assert(
            !!menu.getValue(valueName),
            `menu "${m.name}" contiene value "${valueName}"`
        );
    }
}

// ─── SUITE 10: Nessun back_ nella struttura statica ──────────────────────────
section('SUITE 10 — Nessun back_* nella struttura statica');

assert(
    cli.getActions().filter(a => a.getName().startsWith('back_')).length === 0,
    'nessuna action "back_*" nei actions globali'
);
for (const m of flatMenus()) {
    const menu = cli.getMenu(m.name);
    if (!(menu instanceof MenuChoice)) continue;
    const backValues = menu.getValues().filter(v => v.getValue().startsWith('back_'));
    assert(
        backValues.length === 0,
        `menu "${m.name}" non ha back_* nei values statici`,
        `trovati: ${backValues.map(v => v.getValue()).join(', ')}`
    );
}

// ─── SUITE 11: Back dinamico (navigazione simulata) ───────────────────────────
section('SUITE 11 — Back dinamico (navigazione simulata)');

// CASO 1: main → submenu1 → back → main
simulateRender('submenu1', 'main');
assert(
    getBack('submenu1')?.getTo() === 'main',
    'main→submenu1: back_submenu1.to === "main"',
    `trovato: ${getBack('submenu1')?.getTo()}`
);

// CASO 2: submenu1 → submenu2 → back → submenu1
simulateRender('submenu2', 'submenu1');
assert(
    getBack('submenu2')?.getTo() === 'submenu1',
    'submenu1→submenu2: back_submenu2.to === "submenu1"',
    `trovato: ${getBack('submenu2')?.getTo()}`
);

// CASO 3: main → submenu2 (via goto) → back → main
simulateRender('submenu2', 'main');
assert(
    getBack('submenu2')?.getTo() === 'main',
    'main→submenu2 (via goto): back_submenu2.to === "main"',
    `trovato: ${getBack('submenu2')?.getTo()}`
);

// CASO 4: submenu1→submenu2→language→back→submenu2 poi back→submenu1
simulateRender('submenu2', 'submenu1');
simulateRender('language', 'submenu2');
assert(
    getBack('language')?.getTo() === 'submenu2',
    'submenu2→language: back_language.to === "submenu2"',
    `trovato: ${getBack('language')?.getTo()}`
);
// trigger: torna a submenu2 con il parent che aveva prima
const sub2ParentBeforeLang = getBack('submenu2')?.getTo(); // deve essere 'submenu1'
simulateRender('submenu2', sub2ParentBeforeLang);
assert(
    getBack('submenu2')?.getTo() === 'submenu1',
    'dopo back da language→submenu2: back_submenu2.to === "submenu1"',
    `trovato: ${getBack('submenu2')?.getTo()}`
);

// ─── SUITE 12: MenuInput ──────────────────────────────────────────────────────
section('SUITE 12 — MenuInput');

// Ricava tutti i menu di tipo 'input' dai plugin
const inputMenuDefs = plugins.flatMap(p =>
    (p.menus ?? []).filter(m => m.type === 'input').map(m => ({ ...m, pluginName: p.name }))
);

for (const def of inputMenuDefs) {
    const instance = cli.getMenu(def.name);

    assert(instance instanceof MenuInput,        `"${def.name}" è istanza di MenuInput`);
    assert(instance?.getPlugin() === def.pluginName, `"${def.name}" → plugin "${def.pluginName}"`);

    if ((def as any).placeholder !== undefined) {
        assert(
            (instance as MenuInput).getPlaceholder() === (def as any).placeholder,
            `"${def.name}".placeholder === "${(def as any).placeholder}"`,
            `trovato: ${(instance as MenuInput).getPlaceholder()}`
        );
    }

    assert(
        typeof (instance as MenuInput).getValidate() === ((def as any).validate ? 'function' : 'undefined'),
        `"${def.name}".validate è ${(def as any).validate ? 'una funzione' : 'undefined'}`
    );

    assert(
        typeof (instance as MenuInput).getCallback() === ((def as any).callback ? 'function' : 'undefined'),
        `"${def.name}".callback è ${(def as any).callback ? 'una funzione' : 'undefined'}`
    );

    // Parents: iniettati nel menu parent come value
    const declaredParents = def.parents ?? [];
    for (const parentName of declaredParents) {
        const parentMenu = cli.getMenu(parentName) as MenuChoice | undefined;
        assert(
            !!parentMenu?.getValue(def.name),
            `"${def.name}" è nei values di "${parentName}"`
        );
    }
}

// ─── Risultato finale ─────────────────────────────────────────────────────────
console.log(`\n${'─'.repeat(50)}`);
console.log(`${BOLD}Risultato: ${GREEN}${passed} passed${RESET}${BOLD}, ${failed > 0 ? RED : ''}${failed} failed${RESET}`);
console.log('─'.repeat(50));

if (failed > 0) process.exit(1);