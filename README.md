# CLI Menu Library

Una libreria TypeScript per costruire interfacce CLI interattive con menu, input, selezioni multi-value, traduzioni e stili completamente personalizzabili.

---

## Indice

- [Installazione e avvio](#installazione-e-avvio)
- [Concetti fondamentali](#concetti-fondamentali)
- [Configurazione ambiente (.env)](#configurazione-ambiente-env)
- [Plugin](#plugin)
- [Menu](#menu)
  - [Menu Choice](#menu-choice)
  - [Menu Input](#menu-input)
- [Actions](#actions)
  - [ActionGoto](#actiongoto)
  - [ActionFunction](#actionfunction)
- [Stili](#stili)
  - [Livelli di priorità](#livelli-di-priorità)
  - [Stile idle](#stile-idle)
  - [Stile hover](#stile-hover)
  - [Stile selected](#stile-selected)
- [Configs (configurazioni a livello di menu)](#configs)
  - [defaults](#defaults)
  - [selectable](#selectable)
- [Values](#values)
  - [Values statici](#values-statici)
  - [Values dinamici (funzione)](#values-dinamici-funzione)
  - [Multi-select](#multi-select)
- [Globals](#globals)
- [Parents](#parents)
- [Traduzioni](#traduzioni)
- [Comportamento del cursore e priorità degli stili](#comportamento-del-cursore-e-priorità-degli-stili)
- [Esempi completi](#esempi-completi)

---

## Installazione e avvio

```ts
import { Cli } from './components/cli';

const cli = new Cli();
cli.addPlugin({ ... });
cli.run();
```

---

## Concetti fondamentali

La libreria è organizzata attorno a tre entità principali:

- **Plugin** — contenitore di menu, actions e traduzioni
- **Menu** — schermata interattiva (scelta o input di testo)
- **Action** — azione eseguibile (navigazione o funzione custom)

Un `Cli` può avere più plugin. Ogni plugin dichiara i propri menu e actions. La navigazione avviene tramite `parents` (chi mostra questo item) e `goto` (dove portare l'utente).

---

## Configurazione ambiente (.env)

Il file `.env` (o `.env.local` per override locali) configura i valori predefiniti globali per tutti i menu.

```env
# Lingua di default
DEFAULT_LANGUAGE=it

# Log di debug
DEBUG_LOG=false

# Stile idle (voce a riposo)
DEFAULT_CHOICE_IDLE_PREFIX=" "
DEFAULT_CHOICE_IDLE_COLOR=
DEFAULT_CHOICE_IDLE_UNDERLINE=

# Stile hover (cursore sopra la voce)
DEFAULT_CHOICE_HOVER_PREFIX=❯
DEFAULT_CHOICE_HOVER_COLOR=
DEFAULT_CHOICE_HOVER_UNDERLINE=

# Stile selected (voce selezionata / spuntata)
DEFAULT_CHOICE_SELECTED_PREFIX=★
DEFAULT_CHOICE_SELECTED_COLOR=green
DEFAULT_CHOICE_SELECTED_UNDERLINE=
```

Tutti i valori sono opzionali. Se non impostati, gli stili corrispondenti non vengono applicati.

> **Nota:** `.env.local` ha la precedenza su `.env` e può sovrascrivere qualsiasi valore.

---

## Plugin

Il plugin è il contenitore principale. Ogni plugin ha un nome univoco e può dichiarare menu, actions e traduzioni.

```ts
cli.addPlugin({
    name: 'my-plugin',
    menus: [ ... ],
    actions: [ ... ],
    translations: { ... },
});
```

I nomi di menu e actions all'interno di un plugin diventano automaticamente namespaced: `my-plugin.my-menu`.

---

## Menu

### Menu Choice

Un menu a scelta multipla. L'utente naviga con le frecce e conferma con Enter (o Space per i multi-select).

```ts
{
    name: 'main',
    type: 'choice',
    parents: ['...'],       // in quale menu apparire
    global: false,          // se true: visibile in tutti i menu
    index: 0,               // ordine di comparsa
    idle: { ... },          // stile a riposo
    hover: { ... },         // stile quando il cursore è sopra
    selected: { ... },      // stile quando selezionato
    question: 'Scegli:',    // testo diretto (alternativa alle traduzioni)
    title: 'Main Menu',     // titolo (come voce nei menu parent)
    success: 'OK',          // messaggio di successo
    error: 'Errore',        // messaggio di errore
    values: [ ... ],        // voci del menu (vedi sezione Values)
    configs: { ... },       // configurazioni aggiuntive (vedi sezione Configs)
}
```

### Menu Input

Un campo di testo libero. Supporta validazione, placeholder e submit automatico.

```ts
{
    name: 'nickname',
    type: 'input',
    parents: ['main'],
    placeholder: 'Inserisci il tuo nome...',
    value: '',              // valore iniziale
    clear: true,            // pulisce il terminale all'apertura (default: true)
    fastSubmit: false,      // submit al primo tasto (utile per press-to-continue)
    inline: false,          // mostra su una sola riga senza cursore visibile
    validate: (value) => value.trim().length > 0 || 'Il campo non può essere vuoto',
    callback: async ({ menu, value, language, parent }) => {
        // eseguito dopo la conferma
        console.log('Valore inserito:', value);
        await cli.run('press-to-continue', parent);
    },
}
```

**`validate`** può restituire:
- `true` — valore valido
- `false` — valore non valido (mostra il messaggio di errore generico del menu)
- `string` — valore non valido con messaggio custom (supporta chiavi di traduzione)

**`fastSubmit` + `inline`**: utile per un menu "premi Invio per continuare" che non occupa spazio visivo.

```ts
{
    name: 'press-to-continue',
    type: 'input',
    fastSubmit: true,
    inline: true,
    clear: false,
    callback: async ({ parent }) => {
        await cli.run(parent ?? 'main');
    },
}
```

---

## Actions

### ActionGoto

Naviga verso un altro menu o action.

```ts
{
    name: 'back',
    type: 'goto',
    to: 'main',         // nome del menu/action di destinazione
    global: true,       // se true: appare in tutti i menu
    idle: { color: 'gray' },
}
```

> **`back` speciale:** se il nome è `back` e `global: true`, la libreria lo gestisce automaticamente come tasto "indietro" dinamico — ogni menu riceve un `back_<nomeMenu>` che punta al menu da cui si viene.

### ActionFunction

Esegue una funzione custom.

```ts
{
    name: 'exit',
    type: 'function',
    global: true,
    idle: { color: 'red', italic: true },
    callback: async () => {
        console.log('Arrivederci!');
        process.exit(0);
    },
}
```

---

## Stili

Ogni menu, action e singola voce può avere tre stati stilizzati: **idle**, **hover**, **selected**.

Ogni stile accetta:

| Proprietà | Tipo | Descrizione |
|---|---|---|
| `prefix` | `string` | Carattere/stringa anteposta alla voce |
| `color` | `ColorName` (chalk) | Colore del testo |
| `underline` | `boolean` | Testo sottolineato |
| `italic` | `boolean` | Testo in corsivo |

### Livelli di priorità

Gli stili si applicano in cascata, dal più specifico al più generico:

```
per-option (voce singola)
    → configs del menu
        → .env / .env.local
```

Il livello più specifico vince sempre.

### Stile idle

Applicato quando la voce è a riposo (cursore altrove, non selezionata).

```ts
idle: {
    prefix: '  ',
    color: 'blue',
    underline: false,
    italic: false,
}
```

### Stile hover

Applicato quando il cursore è posizionato sulla voce.

```ts
hover: {
    prefix: '❯ ',
    color: 'cyan',
}
```

Se non specificato, fa fallback al prefix dell'idle.

### Stile selected

Applicato quando la voce è "selezionata" (spuntata). Richiede `selectable: true` nei `configs` del menu per essere visibile.

```ts
selected: {
    prefix: '★ ',
    color: 'green',
}
```

---

## Configs

Le `configs` sono impostazioni a livello di menu che si applicano a tutte le voci del menu (possono essere sovrascritte per-voce).

```ts
configs: {
    idle:      boolean | { prefix?, color?, underline?, italic? },
    hover:     boolean | { prefix?, color?, underline?, italic? },
    selected:  boolean | { prefix?, color?, underline?, italic? },
    selectable: boolean,
    defaults: {
        values: string[],
        callback: async ({ values, menu, parent }) => void,
    },
}
```

`true` come valore per `idle`/`hover`/`selected` significa "usa i valori dell'env".

### defaults

Definisce i valori pre-selezionati all'apertura del menu e il callback da eseguire alla conferma.

```ts
configs: {
    defaults: {
        values: ['en'],   // voci pre-selezionate all'apertura
        callback: async ({ values, menu, parent }) => {
            // values = array delle voci selezionate dall'utente
            // menu   = istanza del MenuField corrente
            // parent = nome del menu parent (da cui si viene)
            Translations.setCurrentLanguage(values[0]);
            await cli.run('press-to-continue', parent);
        },
    },
}
```

> `values` nel callback contiene **solo** le voci che l'utente ha confermato — non necessariamente quelle pre-selezionate, a meno che non le abbia lasciate invariate.

### selectable

Abilita la visualizzazione dello stato "selezionato" (prefix e colore del `selected`) sulle voci del menu. **Default: `false`.**

```ts
configs: {
    selectable: true,   // mostra il prefix/colore selected sulle voci selezionate
}
```

Usare `selectable: true` solo su menu dove ha senso mostrare una selezione persistente:
- Menu di selezione lingua
- Menu multi-select (features, opzioni)

I menu di navigazione normali non ne hanno bisogno: il prefix `selected` apparirebbe su voci già visitate, creando confusione.

---

## Values

Le voci di un menu `choice` possono essere dichiarate in tre modi.

### Values statici

Array di stringhe (nomi di altri menu/actions registrati) o oggetti con stile custom:

```ts
values: ['action1', 'submenu1', 'submenu2']
```

Oppure con stile per-voce:

```ts
values: [
    {
        value: 'darkmode',
        label: 'Dark Mode',
        multi: false,
        idle:     { prefix: '  ', color: 'blue' },
        hover:    { prefix: '❯ ', color: 'cyan' },
        selected: { prefix: '✓ ', color: 'green' },
    },
]
```

Puoi anche passare direttamente riferimenti a istanze Menu/Action tramite `addValue()` via codice.

### Values dinamici (funzione)

Utile quando le voci dipendono da dati runtime (es. lista lingue disponibili):

```ts
values: (data) => Translations.getLanguages().map(lang => ({
    value: lang,
    label: data.menu.getAnswerLabel(lang),   // traduzione della voce
    idle:     lang === 'de' ? { prefix: '*', color: 'magenta' } : undefined,
    hover:    lang === 'es' ? { prefix: '->', color: 'yellow' } : undefined,
    selected: lang === 'fr' ? { prefix: '✓', color: 'red' }    : undefined,
}))
```

`data.menu` è l'istanza del menu corrente, utile per accedere a traduzioni e stato.

### Multi-select

Impostando `multi: true` su una voce, l'utente può selezionare più voci con **Space** e confermare tutte con **Enter**.

```ts
values: [
    { value: 'notifications', label: 'Notifiche',    multi: true },
    { value: 'darkmode',      label: 'Dark Mode',    multi: true },
    { value: 'autosave',      label: 'Auto Save',    multi: true },
    { value: 'analytics',     label: 'Analytics',    multi: true },
]
```

Per ricevere i valori selezionati, usare `defaults.callback`:

```ts
configs: {
    selectable: true,
    defaults: {
        values: [],   // nessuna pre-selezione
        callback: async ({ values, menu, parent }) => {
            console.log('Selezionati:', values);
            await cli.run('press-to-continue', parent);
        },
    },
}
```

---

## Globals

Un menu o action con `global: true` appare automaticamente in **tutti** i menu dell'applicazione, separato dal resto da un divisore.

```ts
// Action globale: appare in fondo a ogni menu
{
    name: 'exit',
    type: 'function',
    global: true,
    idle: { color: 'red' },
    callback: async () => process.exit(0),
}

// Menu globale: es. cambio lingua
{
    name: 'language',
    type: 'choice',
    global: true,
    ...
}
```

**Comportamento dei globals:**
- Vengono mostrati in fondo, dopo un separatore `──────────────`
- Non mostrano mai il prefix `selected`, indipendentemente da `selectable`
- Il prefix hover funziona normalmente (il cursore si vede)
- L'ordinamento segue `index`: indici negativi vanno in fondo ai globals, indici positivi vanno in cima

**`back` globale:**

L'action `back` con `global: true` e `name: 'back'` è speciale: la libreria la trasforma automaticamente in un `back_<nomeMenu>` che ricorda da dove si viene. Non serve gestirla manualmente.

```ts
{
    name: 'back',
    type: 'goto',
    to: 'main',   // fallback se non c'è un parent noto
    global: true,
}
```

---

## Parents

I `parents` dichiarano in quale menu una voce deve apparire automaticamente.

```ts
{
    name: 'submenu1',
    type: 'choice',
    parents: ['main'],   // appare automaticamente nel menu 'main'
}
```

È equivalente a chiamare `mainMenu.addValue(submenu1)` manualmente, ma viene gestito dalla libreria al momento del `load()`.

Un menu/action può avere più parents:

```ts
parents: ['main', 'submenu1', 'submenu2']
```

---

## Traduzioni

Le traduzioni usano chiavi nel formato `<plugin>.<menu>.<campo>`.

```ts
translations: {
    'my-plugin.my-menu.title': {
        en: 'My Menu',
        it: 'Il mio menu',
        fr: 'Mon menu',
    },
    'my-plugin.my-menu.question': {
        en: 'Choose an option:',
        it: "Scegli un'opzione:",
    },
    'my-plugin.my-menu.success': {
        en: 'Done!',
        it: 'Fatto!',
    },
    'my-plugin.my-menu.error': {
        en: 'Invalid value',
        it: 'Valore non valido',
    },
    // Traduzione di una singola voce (usato con getAnswerLabel)
    'my-plugin.my-menu.answer.my-value': {
        en: 'My Value',
        it: 'Il mio valore',
    },
}
```

**Campi supportati per menu:**

| Chiave | Quando viene usata |
|---|---|
| `<plugin>.<menu>.title` | Come etichetta della voce nei menu parent |
| `<plugin>.<menu>.question` | Come testo della domanda nel prompt |
| `<plugin>.<menu>.success` | Messaggio di successo (dopo callback) |
| `<plugin>.<menu>.error` | Messaggio di errore (validazione input) |
| `<plugin>.<menu>.answer.<value>` | Etichetta di una singola voce (usata con `getAnswerLabel`) |
| `<plugin>.<menu>.placeholder` | Placeholder del campo input |

**Disabilitare le traduzioni:**

Rimuovere `DEFAULT_LANGUAGE` dal `.env`. In assenza di lingua, vengono usati i campi `question`, `title`, `success`, `error` dichiarati direttamente nel menu (testo diretto).

---

## Comportamento del cursore e priorità degli stili

Quando il cursore si muove su una voce, prefix e colore seguono regole diverse per offrire la massima leggibilità:

### Voce normale (non selezionabile)

| Stato | Prefix | Colore |
|---|---|---|
| Cursore sopra | `hover › idle` | `hover › idle` |
| A riposo | `idle` | `idle` |

### Voce selezionabile (`selectable: true`)

| Stato | Prefix | Colore label |
|---|---|---|
| Cursore sopra + appena selezionata (Space) | `selected › hover › idle` | `selected › hover › idle` |
| Cursore sopra + già selezionata in precedenza | `selected › hover › idle` | `hover › selected › idle` |
| Selezionata, cursore altrove | `selected › idle` | `selected › idle` |
| A riposo | `idle` | `idle` |

**Logica "appena selezionata":** nel frame immediatamente successivo alla pressione di Space, il colore della label usa lo stile `selected` (feedback visivo immediato). Al primo movimento del cursore, torna alla priorità normale (hover vince sul colore).

**Globals:** non mostrano mai lo stile `selected`, indipendentemente da `selectable`.

---

## Esempi completi

### Applicazione minima

```ts
import { Cli } from './components/cli';

const cli = new Cli();

cli.addPlugin({
    name: 'app',
    menus: [
        {
            name: 'main',
            type: 'choice',
            question: 'Cosa vuoi fare?',
            values: [],
        },
    ],
    actions: [
        {
            name: 'back',
            type: 'goto',
            to: 'main',
            global: true,
        },
        {
            name: 'exit',
            type: 'function',
            global: true,
            idle: { color: 'red' },
            callback: async () => process.exit(0),
        },
        {
            name: 'say-hello',
            type: 'function',
            parents: ['main'],
            title: 'Saluta',
            callback: async () => console.log('Ciao!'),
        },
    ],
});

cli.run();
```

---

### Menu con stili personalizzati per-voce

```ts
{
    name: 'features',
    type: 'choice',
    parents: ['main'],
    configs: {
        selectable: true,
        idle:     { prefix: '  ', color: 'blue' },
        hover:    { prefix: '❯ ', color: 'red' },
        selected: { prefix: '✓ ', color: 'green' },
        defaults: {
            values: [],
            callback: async ({ values, parent }) => {
                console.log('Features abilitate:', values);
                await cli.run('press-to-continue', parent);
            },
        },
    },
    values: [
        { value: 'notifications', label: 'Notifiche',  multi: true },
        { value: 'darkmode',      label: 'Dark Mode',  multi: true },
        { value: 'autosave',      label: 'Auto Save',  multi: true },
        {
            // Override per questa voce specifica
            value: 'analytics',
            label: 'Analytics',
            multi: true,
            idle:     { prefix: '~ ', color: 'gray' },
            hover:    { prefix: '» ', color: 'yellow' },
            selected: { prefix: '★ ', color: 'magenta' },
        },
    ],
}
```

---

### Selezione lingua con traduzioni

```ts
{
    name: 'language',
    type: 'choice',
    global: true,
    configs: {
        selectable: true,
        hover:    { prefix: '❯ ', color: 'cyan' },
        selected: { prefix: '#',  italic: true, underline: true },
        defaults: {
            values: [Translations.getDefaultLanguage()!],
            callback: async ({ values, menu, parent }) => {
                if (values.length > 0) {
                    Translations.setCurrentLanguage(values[0]);
                    console.log(menu.getSuccessLabel(Translations.getSelectedLanguage()));
                    await cli.run('press-to-continue', parent);
                }
            },
        },
    },
    values: (data) => Translations.getLanguages().map(lang => ({
        value: lang,
        label: data.menu.getAnswerLabel(lang),
    })),
}
```

---

### Input con validazione

```ts
{
    name: 'nickname',
    type: 'input',
    parents: ['main'],
    placeholder: 'Inserisci il tuo nickname...',
    validate: (value) => value.trim().length > 0 || 'Il nickname non può essere vuoto',
    callback: async ({ menu, value, language, parent }) => {
        console.log(`Nickname impostato: ${value}`);
        await cli.run('press-to-continue', parent);
    },
}
```

---

### Press-to-continue (pattern comune)

```ts
// Nel plugin default
{
    name: 'press-to-continue',
    type: 'input',
    clear: false,
    fastSubmit: true,
    inline: true,
    callback: async ({ parent }) => {
        await cli.run(parent ?? 'main');
    },
}

// Utilizzo in un callback
callback: async ({ parent }) => {
    console.log('Operazione completata!');
    await cli.run('press-to-continue', parent);
}
```