import { Cli } from "@/components/cli";
import { Translations } from "@/components/translations";
import { MenuChoice, MenuChoiceJson, MenuInput, MenuInputJson, MenuField } from "@/components/menus";
import { ActionGoto, ActionGotoJson, ActionFunctionJson, ActionFunction } from "@/components/actions";
import { PluginJson } from "@/components/plugins";

type MenuDefJson = (MenuChoiceJson | MenuInputJson) & { pluginName: string };
type ActionDefJson = (ActionGotoJson | ActionFunctionJson) & { pluginName: string };

/** Typed access to Cli's protected getActionTypeBack for testing. */
type TestCli = { getActionTypeBack(menu: MenuField | MenuChoice): ActionGoto | undefined };

// Output helpers
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

// Plugin configuration
const plugins: PluginJson[] = [
    {
        name: "default",
        menus: [
            {
                name: "main",
                type: "choice",
                styles: { idle: { color: "green" } },
                values: [],
            },
            {
                name: "language",
                type: "choice",
                global: true,
                configs: {
                    selectable: true,
                    callback: async (data): Promise<void> => {
                        if (data.values.length > 0) {
                            setTimeout(() => cli.trigger(data.menu, "back"), 3000);
                        }
                    },
                },
                values: (data) =>
                    Translations.getLanguages().map((lang) => ({
                        value: lang,
                        idle: lang == "de" ? { prefix: "·", color: "gray" as const } : undefined,
                        hover: lang == "de" ? { prefix: "»", color: "white" as const } : undefined,
                        selected: lang == "fr" ? { prefix: "✓ ", color: "red" as const } : undefined,
                        labels: { title: `${data.menu.getLabels().getAnswer()?.getName()}.${lang}` },
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
                styles: { idle: { color: "red" } },
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
                    selectable: true,
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
                labels: {
                    placeholder: "Enter your nickname...",
                },
                configs: {
                    validate: (value: string): boolean | string =>
                        value.trim().length > 0 || "Nickname cannot be empty",
                    callback: async (): Promise<void> => {},
                },
            },
        ],
        actions: [
            {
                name: "action1",
                type: "function",
                styles: { idle: { color: "blue" } },
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

// CLI setup
const cli = new Cli();
plugins.forEach((p) => cli.addPlugin(p));

// Test helpers

function getBack(menuName: string): ActionGoto | undefined {
    const menu = cli.getMenu(menuName) as MenuChoice | undefined;
    return menu ? (cli as unknown as TestCli).getActionTypeBack(menu) : undefined;
}

function simulateRender(menuName: string, parentName?: string): void {
    const menu = cli.getMenu(menuName) as MenuChoice | undefined;
    if (menu && menuName !== "main") {
        const existing = getBack(menuName);
        if (existing) {
            existing.setTo(parentName ?? "main");
        } else {
            const backTemplate = cli.getAction("back") as ActionGoto;
            if (backTemplate) {
                const backAction = new ActionGoto(backTemplate.toJson())
                    .setName(`back_${menuName}`)
                    .setTo(parentName ?? "main");
                menu.addOption(backAction);
            }
        }
    }
}

function flatMenus(): MenuDefJson[] {
    return plugins.flatMap((p) => (p.menus ?? []).map((m) => ({ ...m, pluginName: p.name }) as MenuDefJson));
}
function flatActions(): ActionDefJson[] {
    return plugins.flatMap((p) => (p.actions ?? []).map((a) => ({ ...a, pluginName: p.name })));
}

// SUITE 1: Registered menus
section("SUITE 1 — Registered menus");
for (const m of flatMenus()) {
    assert(!!cli.getMenu(m.name), `menu "${m.name}" registered`);
}

// SUITE 2: Registered actions
section("SUITE 2 — Registered actions");
for (const a of flatActions()) {
    assert(!!cli.getAction(a.name), `action "${a.name}" registered`);
}

// SUITE 3: Assigned plugins
section("SUITE 3 — Assigned plugins");
for (const m of flatMenus()) {
    assert(
        cli.getMenu(m.name)?.getPlugin() === m.pluginName,
        `menu "${m.name}" → plugin "${m.pluginName}"`,
        `got: ${cli.getMenu(m.name)?.getPlugin()}`
    );
}
for (const a of flatActions()) {
    assert(
        cli.getAction(a.name)?.getPlugin() === a.pluginName,
        `action "${a.name}" → plugin "${a.pluginName}"`,
        `got: ${cli.getAction(a.name)?.getPlugin()}`
    );
}

// SUITE 4: Global flag
section("SUITE 4 — Global flag");
for (const m of flatMenus()) {
    const isGlobal = m.global === true;
    assert(cli.getMenu(m.name)?.isGlobal() === isGlobal, `menu "${m.name}" isGlobal === ${isGlobal}`);
}
for (const a of flatActions()) {
    const isGlobal = a.global === true;
    assert(cli.getAction(a.name)?.isGlobal() === isGlobal, `action "${a.name}" isGlobal === ${isGlobal}`);
}

// SUITE 5: Action types
section("SUITE 5 — Action types");
for (const a of flatActions()) {
    const instance = cli.getAction(a.name);
    if (a.type === "goto") {
        assert(instance instanceof ActionGoto, `action "${a.name}" is ActionGoto`);
        assert(
            (instance as ActionGoto).getTo() === a.to,
            `action "${a.name}".to === "${a.to}"`,
            `got: ${(instance as ActionGoto).getTo()}`
        );
    } else {
        assert(instance instanceof ActionFunction, `action "${a.name}" is ActionFunction`);
    }
}

// SUITE 6: Styles
section("SUITE 6 — Styles");
for (const m of flatMenus()) {
    if (m.styles?.idle?.color) {
        assert(
            cli.getMenu(m.name)?.getStyles().getIdle()?.getColor() === m.styles.idle.color,
            `menu "${m.name}".styles.idle.color === "${m.styles.idle.color}"`,
            `got: ${cli.getMenu(m.name)?.getStyles().getIdle()?.getColor()}`
        );
    }
}
for (const a of flatActions()) {
    if (a.styles?.idle?.color) {
        assert(
            cli.getAction(a.name)?.getStyles().getIdle()?.getColor() === a.styles.idle.color,
            `action "${a.name}".styles.idle.color === "${a.styles.idle.color}"`,
            `got: ${cli.getAction(a.name)?.getStyles().getIdle()?.getColor()}`
        );
    }
}

// SUITE 7: Declared parents
section("SUITE 7 — Declared parents");
for (const m of flatMenus()) {
    const declaredParents = m.parents ?? [];
    const actualParents = cli.getMenu(m.name)?.getParents() ?? [];
    if (declaredParents.length > 0) {
        for (const p of declaredParents) {
            assert(actualParents.includes(p), `menu "${m.name}" has parent "${p}"`);
        }
    } else {
        assert(
            actualParents.length === 0,
            `menu "${m.name}" has no declared parents`,
            `got: ${actualParents.join(", ")}`
        );
    }
}
for (const a of flatActions()) {
    const declaredParents = a.parents ?? [];
    const actualParents = cli.getAction(a.name)?.getParents() ?? [];
    if (declaredParents.length > 0) {
        for (const p of declaredParents) {
            assert(actualParents.includes(p), `action "${a.name}" has parent "${p}"`);
        }
    } else {
        assert(
            actualParents.length === 0,
            `action "${a.name}" has no declared parents`,
            `got: ${actualParents.join(", ")}`
        );
    }
}

// SUITE 8: Values injected via parents
section("SUITE 8 — Values injected from parents");
for (const m of flatMenus()) {
    for (const parentName of m.parents ?? []) {
        const parentMenu = cli.getMenu(parentName) as MenuChoice | undefined;
        assert(!!parentMenu?.getOption(m.name), `menu "${m.name}" is in values of "${parentName}"`);
    }
}
for (const a of flatActions()) {
    for (const parentName of a.parents ?? []) {
        const parentMenu = cli.getMenu(parentName) as MenuChoice | undefined;
        assert(!!parentMenu?.getOption(a.name), `action "${a.name}" is in values of "${parentName}"`);
    }
}

// SUITE 9: Declared static values
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
        assert(!!menu.getOption(valueName), `menu "${m.name}" contains value "${valueName}"`);
    }
}

// SUITE 10: No back_ entries in static structure
section("SUITE 10 — No back_* in static structure");
assert(
    cli.getActions().filter((a) => a.getName().startsWith("back_")).length === 0,
    "no \"back_*\" action in global actions"
);
for (const m of flatMenus()) {
    const menu = cli.getMenu(m.name);
    if (!(menu instanceof MenuChoice)) {
        continue;
    }
    const backValues = menu.getOptions().filter((v) => v.getValue().startsWith("back_"));
    assert(
        backValues.length === 0,
        `menu "${m.name}" has no back_* in static values`,
        `got: ${backValues.map((v) => v.getValue()).join(", ")}`
    );
}

// SUITE 11: Dynamic back navigation
section("SUITE 11 — Dynamic back (simulated navigation)");

simulateRender("submenu1", "main");
assert(
    getBack("submenu1")?.getTo() === "main",
    "main→submenu1: back_submenu1.to === \"main\"",
    `got: ${getBack("submenu1")?.getTo()}`
);

simulateRender("submenu2", "submenu1");
assert(
    getBack("submenu2")?.getTo() === "submenu1",
    "submenu1→submenu2: back_submenu2.to === \"submenu1\"",
    `got: ${getBack("submenu2")?.getTo()}`
);

simulateRender("submenu2", "main");
assert(
    getBack("submenu2")?.getTo() === "main",
    "main→submenu2 (via goto): back_submenu2.to === \"main\"",
    `got: ${getBack("submenu2")?.getTo()}`
);

simulateRender("submenu2", "submenu1");
simulateRender("language", "submenu2");
assert(
    getBack("language")?.getTo() === "submenu2",
    "submenu2→language: back_language.to === \"submenu2\"",
    `got: ${getBack("language")?.getTo()}`
);
const sub2ParentBeforeLang = getBack("submenu2")?.getTo();
simulateRender("submenu2", sub2ParentBeforeLang);
assert(
    getBack("submenu2")?.getTo() === "submenu1",
    "after back from language→submenu2: back_submenu2.to === \"submenu1\"",
    `got: ${getBack("submenu2")?.getTo()}`
);

// SUITE 12: MenuInput
section("SUITE 12 — MenuInput");

const inputMenuDefs = plugins.flatMap((p) =>
    (p.menus ?? []).filter((m): m is MenuInputJson => m.type === "input").map((m) => ({ ...m, pluginName: p.name }))
);

for (const def of inputMenuDefs) {
    const instance = cli.getMenu(def.name);

    assert(instance instanceof MenuInput, `"${def.name}" is an instance of MenuInput`);
    assert(instance?.getPlugin() === def.pluginName, `"${def.name}" → plugin "${def.pluginName}"`);

    if (def.value !== undefined) {
        assert(
            (instance as MenuInput).getValue() === def.value,
            `"${def.name}".value === "${def.value}"`,
            `got: ${(instance as MenuInput).getValue()}`
        );
    } else {
        assert((instance as MenuInput).getValue() === "", `"${def.name}".value starts empty`);
    }

    if (def.labels?.placeholder !== undefined) {
        assert(
            (instance as MenuInput).getPlaceholder() === def.labels.placeholder,
            `"${def.name}".placeholder === "${def.labels.placeholder}"`,
            `got: ${(instance as MenuInput).getPlaceholder()}`
        );
    }

    assert(
        typeof (instance as MenuInput).getValidate() === (def.configs?.validate ? "function" : "undefined"),
        `"${def.name}".validate is ${def.configs?.validate ? "a function" : "undefined"}`
    );

    assert(
        typeof (instance as MenuInput).getCallback() === (def.configs?.callback ? "function" : "undefined"),
        `"${def.name}".callback is ${def.configs?.callback ? "a function" : "undefined"}`
    );

    for (const parentName of def.parents ?? []) {
        const parentMenu = cli.getMenu(parentName) as MenuChoice | undefined;
        assert(!!parentMenu?.getOption(def.name), `"${def.name}" is in values of "${parentName}"`);
    }
}

// SUITE 13: Per-option styles on language menu
/* section("SUITE 13 — Stili option per-option");

{
    const langMenu = cli.getMenu("language") as MenuChoice | undefined;
    assert(!!langMenu, "menu \"language\" esiste");

    const values = langMenu!.getOptions();

    const frOption = values.find((v) => v.getValue() === "fr");
    assert(!!frOption, "opzione \"fr\" esiste nei values di language");
    assert(
        frOption!.getStyles().getSelected()?.getPrefix() === "✓ ",
        "fr selected.prefix === \"✓ \"",
        `trovato: ${frOption?.getStyles().getSelected()?.getPrefix()}`
    );
    assert(
        frOption!.getStyles().getSelected()?.getColor() === "red",
        "fr selected.color === \"red\"",
        `trovato: ${frOption?.getStyles().getSelected()?.getColor()}`
    );

    const deOption = values.find((v) => v.getValue() === "de");
    assert(!!deOption, "opzione \"de\" esiste nei values di language");
    assert(
        deOption!.getStyles().getIdle()?.getPrefix() === "·",
        "de idle.prefix === \"·\"",
        `trovato: ${deOption?.getStyles().getIdle()?.getPrefix()}`
    );
    assert(
        deOption!.getStyles().getIdle()?.getColor() === "gray",
        "de idle.color === \"gray\"",
        `trovato: ${deOption?.getStyles().getIdle()?.getColor()}`
    );
    assert(
        deOption!.getStyles().getHover()?.getPrefix() === "»",
        "de hover.prefix === \"»\"",
        `trovato: ${deOption?.getStyles().getHover()?.getPrefix()}`
    );
    assert(
        deOption!.getStyles().getHover()?.getColor() === "white",
        "de hover.color === \"white\"",
        `trovato: ${deOption?.getStyles().getHover()?.getColor()}`
    );
} */

// Final result
console.log(`\n${"─".repeat(50)}`);
console.log(
    `${BOLD}Result: ${GREEN}${passed} passed${RESET}${BOLD}, ${failed > 0 ? RED : ""}${failed} failed${RESET}`
);
console.log("─".repeat(50));

if (failed > 0) {
    process.exit(1);
}
