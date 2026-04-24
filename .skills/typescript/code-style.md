# Code style — TypeScript

## No early void `return;`

Never use bare `return;` as a control-flow shortcut inside nested blocks (if, for, while, etc.).
Use `if/else` nesting instead.

**Wrong:**

```ts
async function run(): Promise<void> {
    const globalAction = getGlobalItems().find((g) => g.getName() === answer);
    if (globalAction) {
        await this.run(globalAction);
        return; // ❌
    }
    // more code...
}
```

**Correct:**

```ts
async function run(): Promise<void> {
    const globalAction = getGlobalItems().find((g) => g.getName() === answer);
    if (globalAction) {
        await this.run(globalAction);
    } else {
        // more code...
    }
}
```

The ESLint rule `flowstyle/no-early-void-return` enforces this. A bare `return;` is only allowed as the very last statement of a function body.

## Single return via variable

In functions that return a value through multiple branches, declare a single result variable and assign it in each branch. End the function with one `return`.

**Wrong:**

```ts
function getResult(x: string): string | undefined {
    if (conditionA) {
        return "a"; // ❌
    } else {
        return "b"; // ❌
    }
}
```

**Correct:**

```ts
function getResult(x: string): string | undefined {
    let result: string | undefined;
    if (conditionA) {
        result = "a";
    } else {
        result = "b";
    }
    return result;
}
```

## Early exit without `break` in loops

When processing a loop and a match is found, use a `handled` flag + `break` instead of `return;`.

**Correct:**

```ts
let handled = false;
for (const answer of answers) {
    if (matchesGlobal(answer)) {
        await this.run(answer);
        handled = true;
        break;
    }
}
if (!handled) {
    // fallback logic
}
```

## Braces always required

All `if`, `else`, `for`, `while` bodies must use braces, even for single statements (enforced by ESLint `curly: ["error", "all"]`).

## Brace style

Opening braces on the same line as the statement (`1tbs`). No same-line single-statement blocks (enforced by `brace-style: ["error", "1tbs", { allowSingleLine: false }]`).

## Multiline ternary assignments — dangling semicolon

When a ternary assignment spans multiple lines, the semicolon must go on its **own line**, indented to match the assignment.

**Wrong:**

```ts
this.hover =
    hover instanceof StyleHover
        ? hover
        : new StyleHover(hover.prefix, hover.color, hover.underline, hover.italic); // ❌ ; inline
```

**Correct:**

```ts
this.hover = hover instanceof StyleHover
    ? hover
    : new StyleHover(hover.prefix, hover.color, hover.underline, hover.italic)
; // ✅ ; on its own line
```

The condition goes on the same line as the assignment (`variable = condition`). Branches follow on separate lines. The `;` closes alone on the next line, indented at the statement level.

The ESLint rule `flowstyle/multiline-ternary-format` enforces and **auto-fixes** this (`eslint --fix`).
