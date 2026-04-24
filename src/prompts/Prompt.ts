import { createPrompt, useState, useKeypress, usePrefix, isEnterKey, isSpaceKey, Separator } from "@inquirer/core";
import chalk, { ColorName } from "chalk";

// Types

interface ChoiceStyle {
    prefix?: string;
    color?: ColorName;
    underline?: boolean;
    italic?: boolean;
    /** Whether this selected style is currently active (pre-selected item). */
    active?: boolean;
}

interface Choice {
    value: string;
    label: string;
    multi: boolean;
    // color?: string;
    idle?: ChoiceStyle;
    hover?: ChoiceStyle;
    selected?: ChoiceStyle;
}

interface PromptConfig {
    message: string;
    // input section
    input?: {
        value?: string;
        placeholder?: string;
        fastSubmit?: boolean;
        inline?: boolean;
        validate?: (value: string) => boolean | string;
    };
    // choices section
    choices?: (Choice | Separator)[];
    /** Pre-selected values for multi-select menus. */
    initialSelected?: string[];
}

type PromptResult =
    | { type: "input"; value: string }
    | { type: "choice"; value: string }
    | { type: "choices"; values: string[] };

interface InputState {
    inputValue: string;
    cursor: number;
    error: string;
}

// Helpers

function isSeparator(item: Choice | Separator): boolean {
    return (
        item != null
        && typeof item === "object"
        && ("separator" in item || ("type" in item && item.type === "separator"))
    );
}

function renderInputLine(
    state: InputState,
    config: { placeholder?: string; fastSubmit?: boolean },
    focused: boolean
): string {
    const { inputValue, cursor } = state;
    const before = inputValue.slice(0, cursor);
    const at = inputValue[cursor] ?? " ";
    const after = inputValue.slice(cursor + 1);

    const cursorDisplay = focused ? before + chalk.inverse(at) + after : before + at + after;

    return inputValue.length > 0
        ? cursorDisplay
        : !config.fastSubmit && config.placeholder
                ? chalk.dim(config.placeholder)
                : "";
}

function handleInputKey(
    key: { name?: string; ctrl?: boolean; sequence?: string },
    state: InputState,
    setState: {
        setInputValue: (v: string) => void;
        setCursor: (v: number) => void;
        setError: (v: string) => void;
    },
    config: { validate?: (value: string) => boolean | string },
    submitFn: (value: string) => void
): boolean {
    const { inputValue, cursor } = state;
    const { setInputValue, setCursor, setError } = setState;

    if (key.name === "enter" || key.name === "return") {
        const validation = config.validate?.(inputValue);
        if (validation !== undefined && validation !== true) {
            setError(typeof validation === "string" ? validation : "Invalid value");
            return true;
        }
        setError("");
        submitFn(inputValue);
        return true;
    } else if (key.name === "backspace") {
        if (cursor > 0) {
            setInputValue(inputValue.slice(0, cursor - 1) + inputValue.slice(cursor));
            setCursor(cursor - 1);
        }
        setError("");
        return true;
    } else if (key.name === "delete") {
        if (cursor < inputValue.length) {
            setInputValue(inputValue.slice(0, cursor) + inputValue.slice(cursor + 1));
        }
        setError("");
        return true;
    } else if (key.name === "left") {
        if (cursor > 0) {
            setCursor(cursor - 1);
        }
        return true;
    } else if (key.name === "right") {
        if (cursor < inputValue.length) {
            setCursor(cursor + 1);
        }
        return true;
    } else if (key.name === "home" || (key.ctrl && key.name === "a")) {
        setCursor(0);
        return true;
    } else if (key.name === "end" || (key.ctrl && key.name === "e")) {
        setCursor(inputValue.length);
        return true;
    } else if (key.name === "space") {
        const next = inputValue.slice(0, cursor) + " " + inputValue.slice(cursor);
        setInputValue(next);
        setCursor(cursor + 1);
        setError("");
        return true;
    } else if (key.name && key.name.length === 1 && !key.ctrl) {
        const next = inputValue.slice(0, cursor) + key.name + inputValue.slice(cursor);
        setInputValue(next);
        setCursor(cursor + 1);
        setError("");
        return true;
    }

    return false;
}

function renderChoiceLines(
    items: (Choice | Separator)[],
    activeIndex: number,
    focusedOnList: boolean,
    selected?: Set<string>,
    justSelected?: Set<string>
): string[] {
    return items.map((item, index) => {
        let line: string;
        if (isSeparator(item)) {
            line = new Separator().separator;
        } else {
            const choice = item as Choice;
            const isActive = focusedOnList && index === activeIndex;
            const isSelected = choice.multi
                ? selected?.has(choice.value) ?? false
                : choice.selected?.active ?? false
            ;
            // True only the render immediately after toggling ON — label color uses selected.
            const isJustSelected = choice.multi && (justSelected?.has(choice.value) ?? false);

            // Style rules — prefix and label are styled independently:
            //
            //  Prefix text   → selected > hover > idle
            //  Prefix color  → selected > hover > idle  (prefix always shows selection state)
            //
            //  Label color   → active: hover > selected > idle  (hover shows cursor position)
            //                  not active + selected: selected > idle
            //                  idle: idle
            //  Label decorate → same priority as label color

            let stylePrefix: string;
            let prefixColor: ColorName | undefined;
            let prefixUnderline: boolean | undefined;
            let prefixItalic: boolean | undefined;
            let labelColor: ColorName | undefined;
            let labelUnderline: boolean | undefined;
            let labelItalic: boolean | undefined;

            if (isActive && isSelected) {
                // Prefix: selected always wins
                stylePrefix = choice.selected?.prefix ?? choice.hover?.prefix ?? choice.idle?.prefix ?? "";
                prefixColor = choice.selected?.color ?? choice.hover?.color ?? choice.idle?.color;
                prefixUnderline = choice.selected?.underline ?? choice.hover?.underline ?? choice.idle?.underline;
                prefixItalic = choice.selected?.italic ?? choice.hover?.italic ?? choice.idle?.italic;
                // Label: justSelected → selected wins (immediate feedback); otherwise hover wins (cursor readability)
                labelColor = isJustSelected
                    ? choice.selected?.color ?? choice.hover?.color ?? choice.idle?.color
                    : choice.hover?.color ?? choice.selected?.color ?? choice.idle?.color
                ;
                labelUnderline = isJustSelected
                    ? choice.selected?.underline ?? choice.hover?.underline ?? choice.idle?.underline
                    : choice.hover?.underline ?? choice.selected?.underline ?? choice.idle?.underline
                ;
                labelItalic = isJustSelected
                    ? choice.selected?.italic ?? choice.hover?.italic ?? choice.idle?.italic
                    : choice.hover?.italic ?? choice.selected?.italic ?? choice.idle?.italic
                ;
            } else if (isActive) {
                stylePrefix = choice.hover?.prefix ?? choice.idle?.prefix ?? "";
                prefixColor = choice.hover?.color ?? choice.idle?.color;
                prefixUnderline = choice.hover?.underline ?? choice.idle?.underline;
                prefixItalic = choice.hover?.italic ?? choice.idle?.italic;
                labelColor = choice.hover?.color ?? choice.idle?.color;
                labelUnderline = choice.hover?.underline ?? choice.idle?.underline;
                labelItalic = choice.hover?.italic ?? choice.idle?.italic;
            } else if (isSelected) {
                stylePrefix = choice.selected?.prefix ?? choice.idle?.prefix ?? "";
                prefixColor = choice.selected?.color ?? choice.idle?.color;
                prefixUnderline = choice.selected?.underline ?? choice.idle?.underline;
                prefixItalic = choice.selected?.italic ?? choice.idle?.italic;
                labelColor = choice.selected?.color ?? choice.idle?.color;
                labelUnderline = choice.selected?.underline ?? choice.idle?.underline;
                labelItalic = choice.selected?.italic ?? choice.idle?.italic;
            } else {
                stylePrefix = choice.idle?.prefix ?? "";
                prefixColor = choice.idle?.color;
                prefixUnderline = choice.idle?.underline;
                prefixItalic = choice.idle?.italic;
                labelColor = choice.idle?.color;
                labelUnderline = choice.idle?.underline;
                labelItalic = choice.idle?.italic;
            }

            const applyStyle = (
                text: string,
                color: ColorName | undefined,
                underline?: boolean,
                italic?: boolean
            ): string => {
                let out = text;
                if (color) {
                    out = chalk[color](out);
                }
                if (underline) {
                    out = chalk.underline(out);
                }
                if (italic) {
                    out = chalk.italic(out);
                }
                return out;
            };

            const prefixLabel = stylePrefix
                ? `${applyStyle(stylePrefix, prefixColor, prefixUnderline, prefixItalic)} `
                : ""
            ;
            // Build label with its own color
            const styledLabel = applyStyle(choice.label, labelColor, labelUnderline, labelItalic);

            line = `${prefixLabel}${styledLabel}`;
        }
        return line;
    });
}

const prompt = createPrompt<PromptResult, PromptConfig>((config, done) => {
    const { message, input: inputCfg, choices: choicesCfg, initialSelected } = config;

    const hasInput = !!inputCfg;
    const hasChoices = !!choicesCfg && choicesCfg.length > 0;

    // Input state
    const initial = inputCfg?.value ?? "";
    const [inputValue, setInputValue] = useState<string>(initial);
    const [cursor, setCursor] = useState<number>(initial.length);
    const [error, setError] = useState<string>("");

    // Choices state
    const allItems = choicesCfg ?? [];
    const firstSelectable = allItems.findIndex((i) => !isSeparator(i));
    const [selected, setSelected] = useState<Set<string>>(new Set(initialSelected ?? []));
    const [justSelected, setJustSelected] = useState<Set<string>>(new Set());
    const [activeIndex, setActiveIndex] = useState<number>(firstSelectable >= 0 ? firstSelectable : 0);

    // Focus: 'input' | 'list', only meaningful when both sections are active
    const [focus, setFocus] = useState<"input" | "list">(hasInput ? "input" : "list");

    const [status, setStatus] = useState<"pending" | "done">("pending");
    const prefix = usePrefix({ status });

    useKeypress((key) => {
        // inline fastSubmit (input only, no choices)
        if (hasInput && inputCfg!.fastSubmit && inputCfg!.inline && !hasChoices) {
            if (status !== "done") {
                setStatus("done");
                done({ type: "input", value: inputValue });
            }
        } else if (hasInput && inputCfg!.fastSubmit && !hasChoices) {
            // fastSubmit without inline
            setStatus("done");
            done({ type: "input", value: inputValue });
        } else if (!hasInput && hasChoices) {
            // choices only (no input section)
            if (isEnterKey(key)) {
                const item = allItems[activeIndex];
                if (!isSeparator(item)) {
                    const choice = item as Choice;
                    if (choice.multi) {
                        setStatus("done");
                        done({ type: "choices", values: Array.from(selected) });
                    } else {
                        setStatus("done");
                        done({ type: "choice", value: choice.value });
                    }
                }
            } else if (isSpaceKey(key)) {
                const item = allItems[activeIndex];
                if (!isSeparator(item)) {
                    const choice = item as Choice;
                    if (choice.multi) {
                        // Toggle multi-select
                        const val = choice.value;
                        const next = new Set(selected);
                        const wasSelected = next.has(val);
                        if (wasSelected) {
                            next.delete(val);
                        } else {
                            next.add(val);
                        }
                        setSelected(next);
                        setJustSelected(wasSelected ? new Set() : new Set([val]));
                    } else {
                        // Non-multi: space acts like enter
                        setStatus("done");
                        done({ type: "choice", value: choice.value });
                    }
                }
            } else if (key.name === "up") {
                setJustSelected(new Set());
                let i = activeIndex === 0 ? allItems.length - 1 : activeIndex - 1;
                while (isSeparator(allItems[i]) && i !== activeIndex) {
                    i = i === 0 ? allItems.length - 1 : i - 1;
                }
                setActiveIndex(i);
            } else if (key.name === "down") {
                setJustSelected(new Set());
                let i = activeIndex === allItems.length - 1 ? 0 : activeIndex + 1;
                while (isSeparator(allItems[i]) && i !== activeIndex) {
                    i = i === allItems.length - 1 ? 0 : i + 1;
                }
                setActiveIndex(i);
            }
        } else {
            // combo: input + choices
            if (focus === "input") {
                if (key.name === "down" || key.name === "tab") {
                    if (hasChoices) {
                        setFocus("list");
                        setActiveIndex(firstSelectable >= 0 ? firstSelectable : 0);
                    }
                } else if (key.name === "up" && hasChoices) {
                    setFocus("list");
                    let idx = allItems.length - 1;
                    while (idx >= 0 && isSeparator(allItems[idx])) {
                        idx--;
                    }
                    if (idx >= 0) {
                        setActiveIndex(idx);
                    }
                } else {
                    handleInputKey(
                        key,
                        { inputValue, cursor, error },
                        { setInputValue, setCursor, setError },
                        { validate: inputCfg?.validate },
                        (value) => {
                            setStatus("done");
                            done({ type: "input", value });
                        }
                    );
                }
            } else {
                // focus === 'list'
                if (key.name === "escape" || key.name === "tab") {
                    setFocus("input");
                } else if (key.name === "up") {
                    if (activeIndex === firstSelectable) {
                        setFocus("input");
                    } else {
                        let idx = activeIndex - 1;
                        while (idx >= 0 && isSeparator(allItems[idx])) {
                            idx--;
                        }
                        if (idx >= 0) {
                            setActiveIndex(idx);
                        }
                    }
                } else if (key.name === "down") {
                    let idx = activeIndex + 1;
                    while (idx < allItems.length && isSeparator(allItems[idx])) {
                        idx++;
                    }
                    if (idx >= allItems.length) {
                        setFocus("input");
                    } else {
                        setActiveIndex(idx);
                    }
                } else if (isEnterKey(key)) {
                    const item = allItems[activeIndex];
                    if (!isSeparator(item)) {
                        setStatus("done");
                        done({ type: "choice", value: (item as Choice).value });
                    }
                }
            }
        }
    });

    // Render

    const lines: string[] = [];

    // Cursor visibility: show only when focused on input, hide when on list or choices-only
    const cursorVisible = hasInput && focus === "input";
    const cursorCode = cursorVisible ? "\x1B[?25h" : "\x1B[?25l";

    if (hasInput) {
        // inline fastSubmit: single line, no prefix
        if (inputCfg!.fastSubmit && inputCfg!.inline && !hasChoices) {
            let inlineResult: string;
            if (status === "done") {
                inlineResult = "\x1b[1A\r\x1b[2K";
            } else {
                inlineResult = `${cursorCode}${chalk.bold(message)} ${chalk.inverse(" ")}`;
            }
            return inlineResult;
        }

        const inputState: InputState = { inputValue, cursor, error };
        const displayValue = renderInputLine(inputState, inputCfg!, focus === "input" || !hasChoices);
        const focusMarker = hasChoices && focus !== "input" ? " " : chalk.cyan("❯");

        if (hasChoices) {
            // combo: header line + input line separate
            lines.push(`${cursorCode}${prefix} ${chalk.bold(message)}`);
            lines.push(`${focusMarker} ${displayValue}`);
        } else {
            // input only: classic single-line look
            lines.push(`${cursorCode}${prefix} ${chalk.bold(message)} ${displayValue}`);
        }
        if (error) {
            lines.push(chalk.red(`  > ${error}`));
        }
    } else {
        // choices only: classic header — hide terminal cursor
        lines.push(`${cursorCode}${prefix} ${message}`);
    }

    if (hasChoices) {
        if (hasInput && allItems.length > 0 && !isSeparator(allItems[0])) {
            lines.push(new Separator().separator);
        }
        // If focus is on input, hide cursor before rendering choices so it doesn't appear below
        const choiceLines = renderChoiceLines(allItems, activeIndex, focus === "list", selected, justSelected);
        if (hasInput && focus === "input") {
            if (choiceLines.length > 0) {
                choiceLines[0] = "\x1B[?25l" + choiceLines[0];
            }
        }
        lines.push(...choiceLines);
    }

    return lines.join("\n");
});

export { type Choice, prompt, Separator };
