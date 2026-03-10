# CLI Menu Library, Complete Reference

A TypeScript library for building interactive terminal interfaces using a **plugin-based architecture**. Define menus, actions, and translations declaratively and wire them together through the `Cli` class.

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Core Concepts](#core-concepts)
3. [Cli](#cli)
4. [Plugins](#plugins)
5. [MenuField, all modes and options](#menufield)
   - [Choices mode](#choices-mode)
   - [Input mode](#input-mode)
   - [Mixed mode](#mixed-mode)
   - [Shared options](#shared-options)
6. [Actions](#actions)
7. [Translations](#translations)
8. [Utility & environment variables](#utility--environment-variables)
9. [Complete examples](#complete-examples)

---

## Quick Start

```ts
import { Cli } from './components/cli';

const cli = new Cli();

cli.addPlugin({
    name: 'default',
    menus: [
        {
            name: 'main',
            type: 'field',
            color: 'green',
            question: 'What would you like to do?',
            modes: { choices: { values: [] } },   // other plugins inject items here
        },
    ],
    actions: [
        {
            name: 'exit',
            type: 'function',
            color: 'red',
            global: true,
            callback: async () => process.exit(0),
        },
    ],
});

cli.run();           // starts at the 'main' menu
// cli.run('other'); // starts at a specific menu
```

---

## Core Concepts

| Concept | Description |
|---|---|
| **Cli** | Central registry. Holds all menus and actions. Entry point for `run()`. |
| **Plugin** | A self-contained unit with its own menus, actions, and translations. |
| **MenuField** | The only menu type. It can show choices, accept text input, or both. |
| **Action** | A navigation helper (`goto`) or executable callback (`function`). |
| **Translation** | Multi-language strings keyed as `plugin.name.label`. |
| **parent** | A menu or action is shown inside another menu by listing it in `parents`. |
| **global** | A menu or action that appears in every choices list (e.g. Back, Exit). |

The `Cli` wires everything together at startup: each menu is populated with the menus and actions whose `parents` array contains its name.

---

## Cli

```ts
const cli = new Cli();
```

### Methods

| Method | Description |
|---|---|
| `addPlugin(plugin)` | Register a plugin. Returns `this` for chaining. |
| `addMenu(menu, plugin?)` | Add a single menu instance or JSON descriptor. |
| `addAction(action, plugin?)` | Add a single action instance or JSON descriptor. |
| `getMenu(name)` | Retrieve a registered menu by name. |
| `getAction(name)` | Retrieve a registered action by name. |
| `run(name?, parent?)` | Start the interactive loop at `name` (default `'main'`). |
| `Cli.write(text, color?)` | Static helper to print colored text. |

---

## Plugins

A plugin groups menus, actions, and translations that belong to a single feature.

```ts
cli.addPlugin({
    name: 'my-plugin',        // prefix used for translation keys
    menus:        [...],
    actions:      [...],
    translations: { ... },
});
```

Multiple plugins can coexist; each is loaded in order. Translation keys, menu names, and action names are global, use the plugin name as a prefix to avoid collisions.

---

## MenuField

`MenuField` is the only menu type. Set `type: 'field'` in your JSON.  
It supports three operating modes: **choices**, **input**, and **both at once**.

### Shared options (all modes)

```ts
{
    name:     string;          // unique identifier, used in translation keys
    type:     'field';
    plugin?:  string;          // set automatically by addPlugin
    color?:   ColorName;       // chalk color for the question line
    index?:   number;          // sort order inside a parent menu
    parents?: string[];        // which menus this item appears in
    global?:  boolean;         // appear in every choices list
    question?: string;         // fallback question text (no translation needed)
    title?:    string;         // fallback title shown in parent menus
    success?:  string;         // fallback success message
    error?:    string;         // fallback validation error message
}
```

---

### Choices mode

Display a list of selectable items.

```ts
modes: {
    choices: {
        values:  Array<string | MenuFieldOptionJson> | (data) => Array<...>;
        configs?: MenuFieldConfigsJson;
    }
}
```

#### `values`, static array of strings

The simplest form. Each string becomes both the value and the label (resolved through translations if a key exists).

```ts
modes: {
    choices: { values: ['apple', 'banana', 'cherry'] }
}
```

#### `values`, array of option objects

```ts
modes: {
    choices: {
        values: [
            {
                value:    'opt-a',          // internal identifier
                label?:   'Option A',       // display text (falls back to value)
                multi?:   true,             // allow multi-selection (space = toggle)
                color?:   'yellow',         // chalk color for this item only
                selected?: {               // custom look when this item is selected
                    prefix?: '★',
                    color?:  'yellow',
                },
            },
        ],
    },
}
```

#### `values`, dynamic function

Evaluated every time the menu renders. Useful when the list depends on runtime state.

```ts
modes: {
    choices: {
        values: ({ menu }) => {
            return myStore.getItems().map(i => ({ value: i.id, label: i.name }));
        },
    },
}
```

#### `configs.defaults`, pre-selected values + confirm callback

```ts
modes: {
    choices: {
        configs: {
            defaults: {
                values?:   ['opt-b', 'opt-d'],   // pre-selected on first render
                callback?: async ({ values, menu, parent }) => {
                    // called when the user confirms the selection
                    console.log('Selected:', values);
                    await cli.run('press-to-continue', parent);
                },
            },
        },
        values: [
            { value: 'opt-a', label: 'A', multi: true },
            { value: 'opt-b', label: 'B', multi: true },
        ],
    },
}
```

#### `configs.selected`, global selected-item style

Applies the same visual treatment to every selected item.

```ts
configs: {
    selected: true // uses DEFAULT_CHOICE_PREFIX / DEFAULT_CHOICE_COLOR from .env
    // or
    selected: {
        prefix?: '✔', // text prepended to the label when selected
        color?:  'green', // chalk color override when selected
    }
}
```

Per-option `selected` overrides the global config for that specific item.

---

### Input mode

Display a text prompt and collect free input from the user.

```ts
modes: {
    input: {
        value?: string; // pre-filled value
        placeholder?: string; // hint shown when empty
        clear?: boolean; // clear screen before showing (default true)
        fastSubmit?: boolean; // confirm on first keypress, no Enter needed
        inline?: boolean; // render input on same line as question
        validate?: (value: string) => boolean | string;
        callback?: async ({ menu, value, language, parent }) => void;
    }
}
```

| Option | Default | Description |
|---|---|---|
| `value` | `''` | Initial value shown in the input box. |
| `placeholder` | `''` | Ghost text when input is empty. Resolved through translations. |
| `clear` | `true` | Whether to `console.clear()` before rendering. |
| `fastSubmit` | `false` | Submit on the very first keypress (ideal for single-key confirmations). |
| `inline` | `false` | Print the input cursor after the question on the same line. |
| `validate` |, | Return `true` to accept, `false` to reject with the default error, or a `string` for a custom error message (also resolved through translations). |
| `callback` |, | Async function called after successful submission. Navigate with `cli.run()` inside it. |

**`validate` examples**

```ts
// Simple boolean
validate: (v) => v.trim().length > 0

// Custom error string
validate: (v) => v.length >= 8 || 'Password must be at least 8 characters'

// Translation key as error
validate: (v) => /^\d+$/.test(v) || 'my-plugin.age.error'
```

---

### Mixed mode

Combine choices and input on the same menu. The user can either pick from the list or type a custom value.

```ts
modes: {
    choices: {
        values: [
            { value: 'small',  label: 'Small' },
            { value: 'medium', label: 'Medium' },
        ],
    },
    input: {
        placeholder: 'or type a custom size…',
        inline: true,
        callback: async ({ value, parent }) => {
            console.log('Custom:', value);
            await cli.run('press-to-continue', parent);
        },
    },
}
```

---

## Actions

Actions appear as selectable items inside menus (via `parents`) or across all menus (`global: true`).

### `function` action, run arbitrary code

```ts
{
    name: 'save',
    type: 'function',
    color?: 'green',
    index?: 0,
    global?: false,
    parents?: ['my-menu'],
    callback: async () => {
        await saveData();
        Cli.write('Saved!', 'green');
    },
}
```

### `goto` action, navigate to another menu

```ts
{
    name: 'back',
    type: 'goto',
    to: 'main', // target menu name
    global: true, // show in every menu
}
```

---

## Translations

All labels in the library are looked up by key before being displayed.  
The key pattern is: **`plugin.menuOrActionName.label`**

```ts
translations: {
    'my-plugin.my-menu.question': { // shown as the prompt question
        en: 'What would you like to do?',
        it: 'Cosa vorresti fare?',
        fr: 'Que voulez-vous faire?',
    },
    'my-plugin.my-menu.title': { // shown in parent menus
        en: 'My Feature',
        it: 'La mia funzione',
    },
    'my-plugin.my-menu.success': { // used by getSuccessLabel()
        en: 'Done!',
    },
    'my-plugin.my-menu.error': { // used by getErrorLabel() / validate
        en: 'Invalid input.',
    },
    'my-plugin.my-menu.answer.opt-a': { // label for choice value 'opt-a'
        en: 'Option A',
    },
    'my-plugin.my-field.placeholder': { // placeholder for input fields
        en: 'Type here…',
    },
}
```

### Fallback chain

1. Translation key resolved to current language → use it.
2. No translation found → use inline `question` / `title` / `success` / `error` from the JSON.
3. No inline text → display the raw key as-is (useful for catching missing keys in dev).

### Language API

```ts
import { Translations } from './components/translations';

Translations.setCurrentLanguage('fr');    // switch language at runtime
Translations.getSelectedLanguage();       // → 'fr'
Translations.getDefaultLanguage();        // from DEFAULT_LANGUAGE env var
Translations.getLanguages();             // all registered languages
```

---

## Utility & environment variables

Configuration is loaded from `.env` (base) and `.env.local` (override).

| Variable | Type | Description |
|---|---|---|
| `DEFAULT_LANGUAGE` | `string` | Default UI language (e.g. `en`, `it`). |
| `DEFAULT_CHOICE_PREFIX` | `string` | Prefix prepended to selected choices (e.g. `›`). |
| `DEFAULT_CHOICE_COLOR` | `ColorName` | Chalk color for selected choices (e.g. `cyan`). |
| `DEBUG_LOG` | `'true'` | Enable session debug logging to `logs/`. |

### Debug logging

When `DEBUG_LOG=true`, every menu interaction is logged to a timestamped file inside the `logs/` folder (created automatically). Each CLI session gets its own file so logs from different runs never mix.

```
logs/
  log-2025-03-05T10-00-00-000Z.log
  log-2025-03-05T10-05-12-342Z.log
```

The `Utility` class exposes:

```ts
Utility.isDebugLog() // → boolean
Utility.getDefaultLanguage() // → Language | undefined
Utility.getDefaultPrefix() // → string | undefined
Utility.getDefaultColor() // → ColorName | undefined
Utility.write(text, color) // → styled string (chalk)
Utility.pressAnyKey(msg?) // → Promise<void>, pause until Enter
```

---

## Complete examples

### Minimal interactive menu

```ts
import { Cli } from './components/cli';

const cli = new Cli();

cli.addPlugin({
    name: 'app',
    menus: [
        {
            name: 'main',
            type: 'field',
            color: 'cyan',
            question: 'Main menu',
            modes: { choices: { values: [] } },
        },
    ],
    actions: [
        {
            name: 'greet',
            type: 'function',
            parents: ['main'],
            callback: async () => Cli.write('Hello!', 'green'),
        },
        {
            name: 'exit',
            type: 'function',
            color: 'red',
            global: true,
            callback: async () => process.exit(0),
        },
    ],
    translations: {
        'app.main.question':  { en: 'What would you like to do?' },
        'app.greet.title':    { en: 'Say hello' },
        'app.exit.title':     { en: 'Exit' },
    },
});

cli.run();
```

---

### Multi-step form

```ts
cli.addPlugin({
    name: 'form',
    menus: [
        {
            name: 'step-name',
            type: 'field',
            parents: ['main'],
            modes: {
                input: {
                    placeholder: 'Your full name',
                    validate: (v) => v.trim().length >= 2 || 'Name too short',
                    callback: async ({ value, parent }) => {
                        state.name = value;
                        await cli.run('step-age', parent);
                    },
                },
            },
        },
        {
            name: 'step-age',
            type: 'field',
            modes: {
                input: {
                    placeholder: 'Your age',
                    validate: (v) => /^\d+$/.test(v) || 'Must be a number',
                    callback: async ({ value, parent }) => {
                        state.age = Number(value);
                        Cli.write(`Hello ${state.name}, age ${state.age}!`, 'green');
                        await cli.run('main');
                    },
                },
            },
        },
    ],
    translations: {
        'form.step-name.title':    { en: 'Enter your name' },
        'form.step-name.question': { en: 'What is your name?' },
        'form.step-age.question':  { en: 'How old are you?' },
    },
});
```

---

### Multi-select with defaults and custom selected style

```ts
cli.addPlugin({
    name: 'prefs',
    menus: [
        {
            name: 'features',
            type: 'field',
            parents: ['main'],
            modes: {
                choices: {
                    configs: {
                        defaults: {
                            values: ['dark-mode'],
                            callback: async ({ values, parent }) => {
                                savePrefs(values);
                                await cli.run('press-to-continue', parent);
                            },
                        },
                        selected: { prefix: '✔', color: 'green' },
                    },
                    values: [
                        { value: 'dark-mode',      label: 'Dark mode',        multi: true },
                        { value: 'notifications',  label: 'Notifications',    multi: true },
                        { value: 'auto-update',    label: 'Auto-update',      multi: true },
                    ],
                },
            },
        },
    ],
    translations: {
        'prefs.features.title':    { en: 'Preferences' },
        'prefs.features.question': { en: 'Enable / disable features:' },
    },
});
```

---

### Language selector (built-in pattern)

```ts
cli.addPlugin({
    name: 'i18n',
    menus: [
        {
            name: 'language',
            type: 'field',
            global: true,
            modes: {
                choices: {
                    configs: {
                        defaults: {
                            values: [Translations.getDefaultLanguage()!],
                            callback: async ({ values, parent }) => {
                                Translations.setCurrentLanguage(values[0]);
                                await cli.run('press-to-continue', parent);
                            },
                        },
                        selected: { prefix: '#' },
                    },
                    values: ({ menu }) =>
                        Translations.getLanguages().map(lang => ({
                            value: lang,
                            label: menu.getAnswerLabel(lang),
                        })),
                },
            },
        },
    ],
    translations: {
        'i18n.language.title':       { en: 'Change language' },
        'i18n.language.answer.en':   { en: 'English', it: 'Inglese' },
        'i18n.language.answer.it':   { en: 'Italian', it: 'Italiano' },
    },
});
```

---

### Press-any-key pause (standard pattern)

Register once in your `default` plugin and reuse everywhere:

```ts
// Registration
{
    name: 'press-to-continue',
    type: 'field',
    modes: {
        input: {
            value: '',
            clear: false,
            fastSubmit: true,
            callback: async ({ parent }) => {
                await cli.run(parent ?? 'main');
            },
        },
    },
}

// Usage inside any callback
Cli.write('Operation complete.', 'green');
await cli.run('press-to-continue', parent);
```