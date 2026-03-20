import { Cli } from "../components/cli";
import { Translations } from "../components/translations";
import {
    MenuChoice,
    MenuChoiceJson,
    MenuInput,
    MenuInputJson,
    MenuField,
} from "../components/menus";
import {
    ActionGoto,
    ActionGotoJson,
    ActionFunctionJson,
    ActionFunction,
} from "../components/actions";
import { PluginJson } from "../components/plugins";

type MenuDefJson = (MenuChoiceJson | MenuInputJson) & { pluginName: string };
type ActionDefJson = (ActionGotoJson | ActionFunctionJson) & { pluginName: string };

/** Typed access to Cli's protected getActionTypeBack for testing. */
type TestCli = { getActionTypeBack(menu: MenuField): ActionGoto | undefined };

// ─── Output helpers ───────────────────────────────────────────────────────────
const GREEN = "\x1b[32m";
const RED = "\x1b[31m";
const YELLOW = "\x1b[33m";
const BOLD = "\x1b[1m";
const RESET = "\x1b[0m";

let passed = 0;
let failed = 0;

function assert(condition: boolean, description: string, detail?: string): void {
    if (condition) {
        console.log(`  ${GREEN}✓${RESET} ${description}`);
        passed++;
    } else {
        console.log(`  ${RED}✗${RESET} ${description}`);
        if (detail) {
            console.log(`    ${YELLOW}→ ${detail}${RESET}`);
        }
        failed++;
    }
}

function section(title: string): void {
    console.log(`\n${BOLD}${title}${RESET}`);
}

// ─── Configurazione plugin (identica a test8.ts) ──────────────────────────────
// Qui va replicata la stessa struttura di plugin dichiarata in test8.ts.
// I test vengono derivati automaticamente da questa configurazione.
const plugins: PluginJson[] = [
    {
        name: "default",
        menus: [
            {
                name: "main",
                type: "choice",
                idle: { color: "green" },
                values: [],
            },
            {
                name: "language",
                type: "choice",
                global: true,
                configs: {
                    idle: { color: "yellow" as const },
                    hover: { prefix: "☆", color: "cyan" as const },
                    defaults: {
                        values: [Translations.getDefaultLanguage()].filter(
                            (v): v is string => v !== undefined
                        ),
                        callback: async (data): Promise<void> => {
                            if (data.values.length > 0) {
                                setTimeout(() => cli.trigger(data.menu, "back"), 3000);
                            }
                        },
                    },
                    selected: { prefix: "#" },
                },
                values: (data) =>
                    Translations.getLanguages().map((lang) => ({
                        value: lang,
                        idle: lang == "de" ? { prefix: "·", color: "gray" as const } : undefined,
                        hover: lang == "de" ? { prefix: "»", color: "white" as const } : undefined,
                        selected:
                            lang == "fr" ? { prefix: "✓ ", color: "red" as const } : undefined,
                        label: data.menu.getAnswerName(lang),
                    })),
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
                idle: { color: "red" },
                callback: async () => process.exit(0),
                global: true,
            },
        ],
        translations: {},
    },
    {
        name: "test1",
        menus: [
            {
                name: "submenu1",
                type: "choice",
                parents: ["main"],
                configs: {
                    idle: true,
                    hover: true,
                    selected: true,
                },
                values: ["subaction1", "submenu2", "nickname"],
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
                placeholder: "Enter your nickname...",
                validate: (value: string): boolean | string =>
                    value.trim().length > 0 || "Nickname cannot be empty",
                callback: async (): Promise<void> => {},
            },
        ],
        actions: [
            {
                name: "action1",
                type: "function",
                idle: { color: "blue" },
                callback: async () => console.log("Action 1 executed"),
                parents: ["main"],
            },
        ],
    },
    {
        name: "test2",
        actions: [
            {
                name: "msubmenu2",
                type: "goto",
                to: "submenu2",
                parents: ["main"],
            },
        ],
    },
];

// ─── Costruzione CLI ──────────────────────────────────────────────────────────
const cli = new Cli();
plugins.forEach((p) => cli.addPlugin(p));

// ─── Helpers per i test ───────────────────────────────────────────────────────

/** Restituisce il back_ ActionGoto di un menu leggendolo dalle sue values. */
function getBack(menuName: string): ActionGoto | undefined {
    const menu = cli.getMenu(menuName) as MenuChoice | undefined;
    return menu ? (cli as unknown as TestCli).getActionTypeBack(menu) : undefined;
}

/**
 * Simula il render di un menu con un dato parent, replicando la logica
 * di costruzione del back_ da cli.run(), senza prompt interattivi.
 */
function simulateRender(menuName: string, parentName?: string): void {
    const menu = cli.getMenu(menuName) as MenuChoice | undefined;
    if (!menu || menuName === "main") {
        return;
    }
    const existing = getBack(menuName);
    if (existing) {
        existing.setTo(parentName ?? "main");
    } else {
        const backTemplate = cli.getAction("back") as ActionGoto;
        if (backTemplate) {
            const backAction = new ActionGoto(backTemplate.toJson())
                .setName(`back_${menuName}`)
                .setTo(parentName ?? "main");
            menu.addValue(backAction);
        }
    }
}

/**
 * Ricava la lista flat di tutti i menu/actions staticamente dichiarati
 * nei plugin, con il relativo plugin di appartenenza.
 */
function flatMenus(): MenuDefJson[] {
    return plugins.flatMap((p) =>
        (p.menus ?? []).map((m) => ({ ...m, pluginName: p.name }) as MenuDefJson)
    );
}
function flatActions(): ActionDefJson[] {
    return plugins.flatMap((p) => (p.actions ?? []).map((a) => ({ ...a, pluginName: p.name })));
}

// ─── SUITE 1: Menus registrati ────────────────────────────────────────────────
section("SUITE 1 — Menus registrati");

for (const m of flatMenus()) {
    assert(!!cli.getMenu(m.name), `menu "${m.name}" registrato`);
}

// ─── SUITE 2: Actions registrate ─────────────────────────────────────────────
section("SUITE 2 — Actions registrate");

for (const a of flatActions()) {
    assert(!!cli.getAction(a.name), `action "${a.name}" registrata`);
}

// ─── SUITE 3: Plugin assegnati ────────────────────────────────────────────────
section("SUITE 3 — Plugin assegnati");

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
section("SUITE 4 — Global flag");

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
section("SUITE 5 — Tipo delle actions");

for (const a of flatActions()) {
    const instance = cli.getAction(a.name);
    if (a.type === "goto") {
        assert(instance instanceof ActionGoto, `action "${a.name}" è ActionGoto`);
        assert(
            (instance as ActionGoto).getTo() === a.to,
            `action "${a.name}".to === "${a.to}"`,
            `trovato: ${(instance as ActionGoto).getTo()}`
        );
    } else {
        assert(instance instanceof ActionFunction, `action "${a.name}" è ActionFunction`);
    }
}

// ─── SUITE 6: Colori ──────────────────────────────────────────────────────────
section("SUITE 6 — Colori");

for (const m of flatMenus()) {
    if (m.idle?.color) {
        assert(
            cli.getMenu(m.name)?.getIdle()?.getColor() === m.idle.color,
            `menu "${m.name}".idle.color === "${m.idle.color}"`,
            `trovato: ${cli.getMenu(m.name)?.getIdle()?.getColor()}`
        );
    }
}
for (const a of flatActions()) {
    if (a.idle?.color) {
        assert(
            cli.getAction(a.name)?.getIdle()?.getColor() === a.idle.color,
            `action "${a.name}".idle.color === "${a.idle.color}"`,
            `trovato: ${cli.getAction(a.name)?.getIdle()?.getColor()}`
        );
    }
}

// ─── SUITE 7: Parents dichiarati ─────────────────────────────────────────────
section("SUITE 7 — Parents dichiarati");

for (const m of flatMenus()) {
    const declaredParents = m.parents ?? [];
    const actualParents = cli.getMenu(m.name)?.getParents() ?? [];
    if (declaredParents.length > 0) {
        for (const p of declaredParents) {
            assert(actualParents.includes(p), `menu "${m.name}" ha parent "${p}"`);
        }
    } else {
        assert(
            actualParents.length === 0,
            `menu "${m.name}" non ha parents dichiarati`,
            `trovati: ${actualParents.join(", ")}`
        );
    }
}
for (const a of flatActions()) {
    const declaredParents = a.parents ?? [];
    const actualParents = cli.getAction(a.name)?.getParents() ?? [];
    if (declaredParents.length > 0) {
        for (const p of declaredParents) {
            assert(actualParents.includes(p), `action "${a.name}" ha parent "${p}"`);
        }
    } else {
        assert(
            actualParents.length === 0,
            `action "${a.name}" non ha parents dichiarati`,
            `trovati: ${actualParents.join(", ")}`
        );
    }
}

// ─── SUITE 8: Values iniettati via parents (load) ─────────────────────────────
section("SUITE 8 — Values iniettati dai parents");

for (const m of flatMenus()) {
    const declaredParents = m.parents ?? [];
    for (const parentName of declaredParents) {
        const parentMenu = cli.getMenu(parentName) as MenuChoice | undefined;
        assert(!!parentMenu?.getValue(m.name), `menu "${m.name}" è nei values di "${parentName}"`);
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
section("SUITE 9 — Values statici dichiarati");

for (const m of flatMenus()) {
    if (m.type !== "choice") {
        continue;
    }
    const rawValues = m.values;
    if (!rawValues || typeof rawValues === "function") {
        continue;
    }
    const menu = cli.getMenu(m.name);
    if (!(menu instanceof MenuChoice)) {
        continue;
    }
    for (const v of rawValues) {
        const valueName = typeof v === "string" ? v : v.value;
        assert(!!menu.getValue(valueName), `menu "${m.name}" contiene value "${valueName}"`);
    }
}

// ─── SUITE 10: Nessun back_ nella struttura statica ──────────────────────────
section("SUITE 10 — Nessun back_* nella struttura statica");

assert(
    cli.getActions().filter((a) => a.getName().startsWith("back_")).length === 0,
    'nessuna action "back_*" nei actions globali'
);
for (const m of flatMenus()) {
    const menu = cli.getMenu(m.name);
    if (!(menu instanceof MenuChoice)) {
        continue;
    }
    const backValues = menu.getValues().filter((v) => v.getValue().startsWith("back_"));
    assert(
        backValues.length === 0,
        `menu "${m.name}" non ha back_* nei values statici`,
        `trovati: ${backValues.map((v) => v.getValue()).join(", ")}`
    );
}

// ─── SUITE 11: Back dinamico (navigazione simulata) ───────────────────────────
section("SUITE 11 — Back dinamico (navigazione simulata)");

// CASO 1: main → submenu1 → back → main
simulateRender("submenu1", "main");
assert(
    getBack("submenu1")?.getTo() === "main",
    'main→submenu1: back_submenu1.to === "main"',
    `trovato: ${getBack("submenu1")?.getTo()}`
);

// CASO 2: submenu1 → submenu2 → back → submenu1
simulateRender("submenu2", "submenu1");
assert(
    getBack("submenu2")?.getTo() === "submenu1",
    'submenu1→submenu2: back_submenu2.to === "submenu1"',
    `trovato: ${getBack("submenu2")?.getTo()}`
);

// CASO 3: main → submenu2 (via goto) → back → main
simulateRender("submenu2", "main");
assert(
    getBack("submenu2")?.getTo() === "main",
    'main→submenu2 (via goto): back_submenu2.to === "main"',
    `trovato: ${getBack("submenu2")?.getTo()}`
);

// CASO 4: submenu1→submenu2→language→back→submenu2 poi back→submenu1
simulateRender("submenu2", "submenu1");
simulateRender("language", "submenu2");
assert(
    getBack("language")?.getTo() === "submenu2",
    'submenu2→language: back_language.to === "submenu2"',
    `trovato: ${getBack("language")?.getTo()}`
);
// trigger: torna a submenu2 con il parent che aveva prima
const sub2ParentBeforeLang = getBack("submenu2")?.getTo(); // deve essere 'submenu1'
simulateRender("submenu2", sub2ParentBeforeLang);
assert(
    getBack("submenu2")?.getTo() === "submenu1",
    'dopo back da language→submenu2: back_submenu2.to === "submenu1"',
    `trovato: ${getBack("submenu2")?.getTo()}`
);

// ─── SUITE 12: MenuInput ──────────────────────────────────────────────────────
section("SUITE 12 — MenuInput");

// Ricava tutti i menu di tipo 'input' dai plugin
const inputMenuDefs = plugins.flatMap((p) =>
    (p.menus ?? [])
        .filter((m): m is MenuInputJson => m.type === "input")
        .map((m) => ({ ...m, pluginName: p.name }))
);

for (const def of inputMenuDefs) {
    const instance = cli.getMenu(def.name);

    assert(instance instanceof MenuInput, `"${def.name}" è istanza di MenuInput`);
    assert(instance?.getPlugin() === def.pluginName, `"${def.name}" → plugin "${def.pluginName}"`);

    if (def.value !== undefined) {
        assert(
            ((instance as MenuInput).getValue()?.getLabel() ?? "") === def.value,
            `"${def.name}".value === "${def.value}"`,
            `trovato: ${(instance as MenuInput).getValue()?.getLabel() ?? ""}`
        );
    } else {
        assert(((instance as MenuInput).getValue()?.getLabel() ?? "") === "", `"${def.name}".value inizia vuoto`);
    }

    if (def.placeholder !== undefined) {
        assert(
            (instance as MenuInput).getPlaceholder() === def.placeholder,
            `"${def.name}".placeholder === "${def.placeholder}"`,
            `trovato: ${(instance as MenuInput).getPlaceholder()}`
        );
    }

    assert(
        typeof (instance as MenuInput).getValidate() === (def.validate ? "function" : "undefined"),
        `"${def.name}".validate è ${def.validate ? "una funzione" : "undefined"}`
    );

    assert(
        typeof (instance as MenuInput).getCallback() === (def.callback ? "function" : "undefined"),
        `"${def.name}".callback è ${def.callback ? "una funzione" : "undefined"}`
    );

    // Parents: iniettati nel menu parent come value
    const declaredParents = def.parents ?? [];
    for (const parentName of declaredParents) {
        const parentMenu = cli.getMenu(parentName) as MenuChoice | undefined;
        assert(!!parentMenu?.getValue(def.name), `"${def.name}" è nei values di "${parentName}"`);
    }
}

// ─── SUITE 13: Configurazioni Idle/Hover/Selected ────────────────────────────
section("SUITE 13 — Configurazioni Idle/Hover/Selected");

// Test: language menu has idle config
{
    const langMenu = cli.getMenu("language") as MenuChoice | undefined;
    assert(!!langMenu, 'menu "language" esiste');
    assert(langMenu!.isConfigIdle(), "language ha config idle");
    assert(langMenu!.isConfigHover(), "language ha config hover");
    assert(langMenu!.isConfigSelected(), "language ha config selected");

    // Check idle config values
    const idleCfg = langMenu!.getChoiceConfigs()?.getIdle();
    assert(
        idleCfg?.getColor() === "yellow",
        'language idle.color === "yellow"',
        `trovato: ${idleCfg?.getColor()}`
    );

    // Check hover config values
    const hoverCfg = langMenu!.getChoiceConfigs()?.getHover();
    assert(
        hoverCfg?.getPrefix() === "☆",
        'language hover.prefix === "☆"',
        `trovato: ${hoverCfg?.getPrefix()}`
    );
    assert(
        hoverCfg?.getColor() === "cyan",
        'language hover.color === "cyan"',
        `trovato: ${hoverCfg?.getColor()}`
    );

    // Check selected config values
    const selectedCfg = langMenu!.getChoiceConfigs()?.getSelected();
    assert(
        selectedCfg?.getPrefix() === "#",
        'language selected.prefix === "#"',
        `trovato: ${selectedCfg?.getPrefix()}`
    );
}

// Test: per-option overrides on language values
{
    const langMenu = cli.getMenu("language") as MenuChoice | undefined;
    const values = langMenu!.getValues();

    // 'fr' option should have per-option selected override
    const frOption = values.find((v) => v.getValue() === "fr");
    assert(!!frOption, 'opzione "fr" esiste nei values di language');
    assert(
        frOption!.getSelectedPrefix() === "✓ ",
        'fr selected.prefix === "✓ "',
        `trovato: ${frOption?.getSelectedPrefix()}`
    );
    assert(
        frOption!.getSelectedColor() === "red",
        'fr selected.color === "red"',
        `trovato: ${frOption?.getSelectedColor()}`
    );

    // 'de' option should have per-option idle & hover overrides
    const deOption = values.find((v) => v.getValue() === "de");
    assert(!!deOption, 'opzione "de" esiste nei values di language');
    assert(
        deOption!.getIdlePrefix() === "·",
        'de idle.prefix === "·"',
        `trovato: ${deOption?.getIdlePrefix()}`
    );
    assert(
        deOption!.getIdleColor() === "gray",
        'de idle.color === "gray"',
        `trovato: ${deOption?.getIdleColor()}`
    );
    assert(
        deOption!.getHoverPrefix() === "»",
        'de hover.prefix === "»"',
        `trovato: ${deOption?.getHoverPrefix()}`
    );
    assert(
        deOption!.getHoverColor() === "white",
        'de hover.color === "white"',
        `trovato: ${deOption?.getHoverColor()}`
    );

    // Non-overridden options (e.g. 'en') should inherit menu-level config
    const enOption = values.find((v) => v.getValue() === "en");
    assert(!!enOption, 'opzione "en" esiste nei values di language');
    assert(
        enOption!.getIdleColor() === "yellow",
        'en idle.color ereditato === "yellow"',
        `trovato: ${enOption?.getIdleColor()}`
    );
    assert(
        enOption!.getHoverPrefix() === "☆",
        'en hover.prefix ereditato === "☆"',
        `trovato: ${enOption?.getHoverPrefix()}`
    );
    assert(
        enOption!.getHoverColor() === "cyan",
        'en hover.color ereditato === "cyan"',
        `trovato: ${enOption?.getHoverColor()}`
    );
    // selected prefix from menu config '#'
    assert(
        enOption!.getSelectedPrefix() === "#",
        'en selected.prefix ereditato === "#"',
        `trovato: ${enOption?.getSelectedPrefix()}`
    );
}

// Test: submenu1 with configs: { idle: true, hover: true, selected: true }
// Uses env defaults from Utility
{
    const sub1 = cli.getMenu("submenu1") as MenuChoice | undefined;
    assert(!!sub1, 'menu "submenu1" esiste');
    assert(sub1!.isConfigIdle(), "submenu1 ha config idle (true → env defaults)");
    assert(sub1!.isConfigHover(), "submenu1 ha config hover (true → env defaults)");
    assert(sub1!.isConfigSelected(), "submenu1 ha config selected (true → env defaults)");
}

// ─── Risultato finale ─────────────────────────────────────────────────────────
console.log(`\n${"─".repeat(50)}`);
console.log(
    `${BOLD}Risultato: ${GREEN}${passed} passed${RESET}${BOLD}, ${failed > 0 ? RED : ""}${failed} failed${RESET}`
);
console.log("─".repeat(50));

if (failed > 0) {
    process.exit(1);
}