# modular-cli-menu

A modular TypeScript library for building interactive CLI interfaces with menus, text inputs, multi-value selections, translations and fully customisable styles.

[![npm version](https://img.shields.io/npm/v/modular-cli-menu)](https://www.npmjs.com/package/modular-cli-menu)
[![CI](https://github.com/blorisl/modular-cli-menu/actions/workflows/ci.yml/badge.svg)](https://github.com/blorisl/modular-cli-menu/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## Table of contents

- [Installation](#installation)
- [Quick start](#quick-start)
- [Core concepts](#core-concepts)
- [Environment configuration (.env)](#environment-configuration-env)
- [Plugins](#plugins)
- [Menus](#menus)
  - [Choice menu](#choice-menu)
  - [Input menu](#input-menu)
  - [Field menu](#field-menu)
  - [Editor menu](#editor-menu)
- [Actions](#actions)
  - [ActionGoto](#actiongoto)
  - [ActionFunction](#actionfunction)
- [Styles](#styles)
  - [Priority cascade](#priority-cascade)
- [Configs](#configs)
- [Values](#values)
- [Globals](#globals)
- [anchorGlobal](#anchorglobal)
- [Parents](#parents)
- [Translations](#translations)
- [Style behaviour and priority rules](#style-behaviour-and-priority-rules)
- [API documentation](#api-documentation)
- [Contributing](#contributing)
- [AI-assisted development](#ai-assisted-development)

---

## Installation

```bash
npm install modular-cli-menu
```

```ts
import { Cli } from "modular-cli-menu";
```

---

## Quick start

```ts
import { Cli } from "modular-cli-menu";

const cli = new Cli();

cli.addPlugin({
    name: "app",
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
            global: true,
            styles: { idle: { color: "red", italic: true } },
            callback: async (): Promise<void> => {
                Cli.write("Goodbye!", "red");
                process.exit(0);
            },
        },
    ],
});

await cli.run();
```

---

## Core concepts

The library is built around three entities:

| Entity | Description |
|---|---|
| **Plugin** | Container for menus, actions, and translations. A `Cli` instance can hold multiple plugins. |
| **Menu** | An interactive screen — either a choice list or a text input. |
| **Action** | Something that happens when a user selects a menu item: navigation (`goto`) or a custom function. |

Navigation is driven by `parents` (which menus show this item) and `goto` (where to send the user).

---

## Environment configuration (.env)

Create a `.env` file at the root of your project to set global defaults for all menus. The library reads it at runtime via `dotenv`, so you can override values without changing code.

```env
# Language
DEFAULT_LANGUAGE=en

# Debug logging (writes to logs/ directory)
DEBUG_LOG=false

# Idle style (cursor elsewhere, not selected)
DEFAULT_CHOICE_IDLE_PREFIX=" "
DEFAULT_CHOICE_IDLE_COLOR=
DEFAULT_CHOICE_IDLE_UNDERLINE=false

# Hover style (cursor on the item)
DEFAULT_CHOICE_HOVER_PREFIX=❯
DEFAULT_CHOICE_HOVER_COLOR=
DEFAULT_CHOICE_HOVER_UNDERLINE=false

# Selected style (item is ticked)
DEFAULT_CHOICE_SELECTED_PREFIX=★
DEFAULT_CHOICE_SELECTED_COLOR=green
DEFAULT_CHOICE_SELECTED_UNDERLINE=false

# Italic modifiers
DEFAULT_CHOICE_IDLE_ITALIC=false
DEFAULT_CHOICE_HOVER_ITALIC=false
DEFAULT_CHOICE_SELECTED_ITALIC=false
```

All values are optional. If unset, the corresponding style property is left `undefined` and the terminal's own theme is respected.

> **Tip:** create a `.env.local` file (git-ignored) to override settings per-machine without touching the committed `.env`.

### The `Env` class

All defaults are managed by the built-in `Env` class:

```ts
import { Utility } from "modular-cli-menu";

const env = Utility.getEnv();

env.getIdleColor();        // returns ColorName | undefined
env.setIdleColor("cyan");  // change at runtime
env.getLanguage();         // "en" | "it" | ...
```

Call `Utility.getEnv().load()` once at startup if you need to force a `.env` reload.

---

## Plugins

A plugin is the top-level container. Menus and actions declared inside a plugin are namespaced automatically: `my-plugin.my-menu`.

```ts
cli.addPlugin({
    name: "my-plugin",
    menus: [ /* ... */ ],
    actions: [ /* ... */ ],
    translations: { /* ... */ },
});
```

Multiple plugins can be chained:

```ts
cli.addPlugin({ name: "core", /* ... */ })
   .addPlugin({ name: "settings", /* ... */ });
```

---

## Menus

### Choice menu

An arrow-key navigation list. Supports single-select, multi-select, and custom styles per item.

```ts
{
    name: "main",
    type: "choice",
    global: false,
    index: 0,
    parents: ["..."],
    styles: {
        idle:     { prefix: "  ", color: "blue" },
        hover:    { prefix: "❯ ", color: "cyan" },
        selected: { prefix: "★ ", color: "green" },
    },
    labels: {
        question: "main.question",   // translation key
        title:    "main.title",
        success:  "main.success",
        error:    "main.error",
    },
    values: [ /* ... */ ],
    configs: { /* ... */ },
}
```

### Input menu

A free-text field. Supports validation, placeholder, and auto-submit.

```ts
{
    name: "nickname",
    type: "input",
    parents: ["main"],
    value: "",
    labels: {
        placeholder: "input.placeholder",
    },
    configs: {
        clear: true,
        fastSubmit: false,
        validate: (value: string): boolean | string =>
            value.trim().length > 0 || "Field cannot be empty",
        callback: async ({ value, parent }): Promise<void> => {
            await cli.run("press-to-continue", parent);
        },
    },
}
```

`validate` can return:
- `true` — valid
- `false` — invalid (shows the menu's generic error label)
- `string` — invalid with a custom message (supports translation keys)

### Field menu

A composite menu combining a `choice` list and an optional `input`. Useful for forms where the user first picks an item and then provides additional text.

```ts
{
    name: "edit-profile",
    type: "field",
    parents: ["main"],
    values: [
        { value: "username", labels: { title: "field.username" } },
        { value: "email",    labels: { title: "field.email" } },
    ],
    configs: {
        choice: { /* choice sub-configs */ },
        input:  { /* input sub-configs */ },
    },
}
```

---

### Editor menu

A full-screen text editor (wraps `@inquirer/editor`). Useful when the user needs to review or edit a multi-line block of text (e.g. a config file, an `.env.local`).

```ts
{
    name: "my-editor",
    type: "editor",
    parents: ["main"],
    labels: { question: "editor.question" },
    configs: {
        default: (): string => loadCurrentFileContent(),   // dynamic default content
        callback: async ({ value }): Promise<void> => {
            saveContent(value);
            await cli.run("press-to-continue", "main");
        },
    },
}
```

The `default` option accepts either a static string or a function returning a string, evaluated fresh each time the editor opens. The user saves and closes the temporary file in their `$EDITOR`.

---

## Actions

### ActionGoto

Navigates to another menu or action.

```ts
{
    name: "back",
    type: "goto",
    to: "main",
    global: true,
    styles: { idle: { color: "gray" } },
}
```

> **Special `back` behaviour:** an action named `back` with `global: true` is automatically transformed into a per-menu back action. Each menu receives a `back_<menuName>` action pointing to wherever the user came from. No manual tracking needed.

### ActionFunction

Runs a custom async callback.

```ts
{
    name: "exit",
    type: "function",
    global: true,
    styles: { idle: { color: "red", italic: true } },
    callback: async (): Promise<void> => {
        Cli.write("Goodbye!", "red");
        process.exit(0);
    },
}
```

---

## Styles

Every menu, action, and individual option can have three style states: **idle**, **hover**, and **selected**.

| Property | Type | Description |
|---|---|---|
| `prefix` | `string` | String prepended to the label |
| `color` | `ColorName` (chalk) | Text colour |
| `underline` | `boolean` | Underlined text |
| `italic` | `boolean` | Italic text |

### Priority cascade

Styles are resolved from most specific to least specific:

```
per-option style
    → menu configs style
        → .env defaults
```

The most specific level always wins.

---

## Configs

`configs` are menu-level settings that apply to all items unless overridden per-item.

**Choice configs:**

```ts
configs: {
    clear: true,
    selectable: false,
    defaultValues: ["en"],
    callback: async ({ values, menu, parent }): Promise<void> => {
        // values = confirmed selections
    },
}
```

**Input configs:**

```ts
configs: {
    clear: true,
    fastSubmit: false,
    validate: (value: string): boolean | string => true,
    callback: async ({ value, parent }): Promise<void> => { /* ... */ },
}
```

`selectable: true` enables the `selected` style state. Use it on menus that represent persistent toggles (e.g., language picker, feature flags). Do **not** use it on plain navigation menus.

---

## Values

### Static values

```ts
values: ["submenu1", "action1"]
```

Or with per-item style overrides:

```ts
values: [
    {
        value: "analytics",
        labels: { title: "analytics.title" },
        styles: {
            idle:     { prefix: "~ ", color: "gray" },
            hover:    { prefix: "» ", color: "yellow" },
            selected: { prefix: "★ ", color: "magenta" },
        },
    },
]
```

### Dynamic values (function)

Computed at runtime — useful when the list depends on external state:

```ts
values: (data): MenuFieldJsonValue[] =>
    Translations.getLanguages().map((lang) => ({
        value: lang,
        labels: { title: data.menu.getLabels().getAnswer(lang)?.getName() },
    }))
```

### Multi-select

Set `multi: true` on individual items. The user confirms with **Space** then **Enter**.

```ts
values: [
    { value: "notifications", multi: true },
    { value: "darkmode",      multi: true },
    { value: "autosave",      multi: true },
]
```

---

## Globals

A menu or action with `global: true` appears automatically at the bottom of **every** menu, separated by a divider.

```ts
{
    name: "exit",
    type: "function",
    global: true,
    styles: { idle: { color: "red" } },
    callback: async (): Promise<void> => { process.exit(0); },
}
```

**Global behaviour:**
- Rendered below a `──────────────` separator
- Never show the `selected` style, regardless of `selectable`
- `index` controls ordering among globals:
  - Globals without an `index` (or `index: 0`) appear first
  - Positive `index` values sort ascending after non-indexed globals
  - Negative `index` values sort at the very bottom, by absolute value ascending (`-1` before `-2` before `-3`)
  - Built-in defaults: `back` → `index: -3`, `language` → `index: -1`, `exit` → `index: -2`

---

## anchorGlobal

`anchorGlobal: true` on a menu marks it as the **entry point of a wizard or multi-step flow**. Any global `ActionGoto` whose target is an `anchorGlobal` menu is automatically hidden from that menu and from all its descendants (menus that have it as a `parents` ancestor, recursively).

**Use case:** you have a global "Create" action that navigates to `env-name-input`. You don't want "Create" to appear _while the user is already inside the Create wizard_, because it would restart the flow. Mark `env-name-input` with `anchorGlobal: true` and declare `parents` on every wizard step menu — the library handles the rest.

```ts
// Entry point of the wizard
{
    name: "env-name-input",
    type: "input",
    anchorGlobal: true,   // hides the "create" global inside this wizard
    /* ... */
}

// Step 2 — declares its parent so the ancestor chain can be traced
{
    name: "repo-selection",
    type: "choice",
    parents: ["env-name-input"],
    /* ... */
}

// Step 3 — also a descendant
{
    name: "branch-select-tars",
    type: "choice",
    parents: ["repo-selection"],
    /* ... */
}
```

The global action that navigates to `env-name-input`:

```ts
{
    name: "create",
    type: "goto",
    to: "env-name-input",
    global: true,
}
```

With `anchorGlobal: true` set, the "create" option disappears from `env-name-input`, `repo-selection`, `branch-select-tars`, and any other menu that has `env-name-input` anywhere in its ancestor chain.

**Requirements:**
- `parents` must be declared statically on every menu in the wizard (the library uses `getParents()` to walk the ancestor chain — it does not infer parents from navigation calls)
- Only `ActionGoto` globals are affected; `ActionFunction` globals are never hidden by `anchorGlobal`

---

## Parents

`parents` declares which menus an item appears in automatically.

```ts
{
    name: "settings",
    type: "choice",
    parents: ["main"],   // automatically added to the "main" menu
}
```

Equivalent to calling `mainMenu.addOption(settingsMenu)` manually, but managed by the library at `load()` time. An item can have multiple parents:

```ts
parents: ["main", "submenu1"]
```

`parents` also serves as the **ancestor chain** used by [`anchorGlobal`](#anchorglobal): the library walks `parents` recursively to determine whether a menu is a descendant of an `anchorGlobal` entry point. For this reason, `parents` must be declared statically on every menu that belongs to a wizard flow — even if navigation is driven programmatically via `cli.run()`.

---

## Translations

Translation keys follow the format `<plugin>.<menu>.<field>`.

```ts
translations: {
    "my-plugin.my-menu.title":    { en: "My Menu",      it: "Il mio menu" },
    "my-plugin.my-menu.question": { en: "Choose:",      it: "Scegli:" },
    "my-plugin.my-menu.success":  { en: "Done!",        it: "Fatto!" },
    "my-plugin.my-menu.error":    { en: "Invalid",      it: "Non valido" },
    "my-plugin.my-menu.answer.en": { en: "English",     it: "Inglese" },
}
```

**Supported label fields:**

| Key suffix | Used for |
|---|---|
| `.title` | Label of this item when shown in a parent menu |
| `.question` | Prompt text shown above the menu |
| `.success` | Message shown after a successful callback |
| `.error` | Validation error message |
| `.answer.<value>` | Label for a specific option |
| `.placeholder` | Placeholder text for input menus |

**Static API:**

```ts
Translations.setCurrentLanguage("it");
Translations.getSelectedLanguage();      // "it"
Translations.getDefaultLanguage();       // from .env DEFAULT_LANGUAGE
Translations.getLanguages();             // all registered languages
```

---

## Style behaviour and priority rules

### Normal item (not selectable)

| State | Prefix | Colour |
|---|---|---|
| Cursor on item | `hover › idle` | `hover › idle` |
| At rest | `idle` | `idle` |

### Selectable item (`selectable: true`)

| State | Prefix | Label colour |
|---|---|---|
| Cursor on + just selected (Space) | `selected › hover › idle` | `selected › hover › idle` |
| Cursor on + already selected | `selected › hover › idle` | `hover › selected › idle` |
| Selected, cursor elsewhere | `selected › idle` | `selected › idle` |
| At rest | `idle` | `idle` |

**"Just selected" logic:** in the single frame immediately after Space is pressed, the label colour uses the `selected` style for immediate visual feedback. On the next cursor move it reverts to the standard priority.

**Globals** never show the `selected` style, even when `selectable: true`.

---

## API documentation

Full HTML documentation is generated automatically from JSDoc comments using **TypeDoc** and published to GitHub Pages on every push to `main`.

**View online:** `https://blorisl.github.io/modular-cli-menu/`

**Generate locally:**

```bash
npm run docs:generate   # generates ./docs/
npm run docs:serve      # serves at http://localhost:8080 (opens browser)
```

Documentation covers all public and protected classes, methods, types and overloads, organised by module:

- `cli` — `Cli` entry point
- `env` — `Env` environment defaults
- `utility` — `Utility` static helper
- `actions` — `Action`, `ActionGoto`, `ActionFunction`, `ActionLabels`
- `menus` — `Menu`, `MenuChoice`, `MenuInput`, `MenuField` and all configs/labels/styles
- `styles` — `StyleIdle`, `StyleHover`, `StyleSelected`
- `translations` — `Translations`, `Label`
- `plugins` — plugin JSON shape

---

## Contributing

See [CONTRIBUTING.md](.github/CONTRIBUTING.md) for the full guide.

Key points:
- Open an issue before starting non-trivial work
- Follow the code style rules (enforced by ESLint — see below)
- Use `npm run git:commit` for conventional commits (uses `czg`)
- CI must pass before merging (dependency safety + lint + tests)

**Available scripts:**

| Command | Description |
|---|---|
| `npm run build` | Compile to `dist/` (ESM + CJS + types) |
| `npm run build:en` | Build with `DEFAULT_LANGUAGE=en` baked in |
| `npm run build:test` | Preview npm package contents via `npm pack --dry-run` |
| `npm run pack` | Build + create `.tgz` |
| `npm run style:dry` | Run ESLint (no fix) |
| `npm run style:apply` | Run ESLint with auto-fix |
| `npm run test` | Run the test suite |
| `npm run dev` | Run `src/dev.ts` (tsx) |
| `npm run example -- <name>` | Run `src/examples/example-<name>.ts` (e.g. `npm run example -- mix`) |
| `npm run publish:dry` | Build + simulate npm publish (no upload) |
| `npm run docs:generate` | Generate HTML docs via TypeDoc |
| `npm run docs:serve` | Serve generated docs at `localhost:8080` |
| `npm run git:commit` | Interactive conventional commit via `czg` |
| `npm run prepare` | Install Husky git hooks (runs automatically on install) |

Before running `npm run publish:dry`, authenticate with npm:

```bash
npm ping
npm whoami || npm login --auth-type=legacy
```

If you switch between multiple npm accounts, use this identity check routine before publishing:

```bash
npm whoami
# if the user is not the expected one:
npm logout
npm login --auth-type=legacy
npm whoami
npm run publish:dry
```

---

## AI-assisted development

This project has been set up so that any AI assistant used by contributors produces consistent, rule-compliant code.

### How it works

All coding rules are stored in `.skills/`, organised by language:

```
.skills/
  typescript/
    code-style.md    — control flow patterns (no early void return, single return variable, braces)
    conventions.md   — TypeScript conventions (no-any, explicit return types, @/ imports)
```

Tool-specific instruction files point back to `.skills/` as the single source of truth:

| File | Tool |
|---|---|
| [`.github/copilot-instructions.md`](.github/copilot-instructions.md) | GitHub Copilot |
| [`SKILLS.md`](SKILLS.md) | Cursor, Claude, and other AI agents |

### Key rules enforced by ESLint

- **No early `void` return** (`flowstyle/no-early-void-return`) — use `if/else` nesting instead of bare `return;` as a control-flow shortcut
- **Single return via variable** — declare one result variable, assign in each branch, return once
- **Explicit return types** (`@typescript-eslint/explicit-function-return-type`) — all functions must declare their return type
- **No `any`** (`@typescript-eslint/no-explicit-any`) — type everything explicitly
- **`@/` path alias** — use `import { Foo } from "@/components/foo"` instead of relative paths inside `src/`
- **Braces always required** (`curly: ["error", "all"]`) — even for single-line `if` bodies

### Adding or updating rules

1. Edit the relevant file in `.skills/typescript/`
2. If the rule can be automated, add or update the corresponding ESLint rule in `eslint.config.mjs`
3. Update `.github/copilot-instructions.md` if the rule requires a prose description for AI context

Any PR that breaks ESLint will be blocked by CI.


