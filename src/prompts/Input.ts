import { createPrompt, useState, useKeypress, usePrefix, isEnterKey } from '@inquirer/core';
import chalk from 'chalk';

interface InputConfig {
    message: string;
    value?: string;
    placeholder?: string;
    fastSubmit?: boolean;
    /**
     * When true (and fastSubmit is true), renders the question on a single
     * line without the "?" prefix and without leaving a blank line after the
     * keypress.  Useful for "Press any key to continue" prompts.
     */
    inline?: boolean;
    validate?: (value: string) => boolean | string;
}

/**
 * Shared state shape for input-based prompts.
 */
interface InputState {
    inputValue: string;
    cursor: number;
    error: string;
}

/**
 * Returns the rendered cursor display for the input value.
 */
function renderInputLine(state: InputState, config: InputConfig, focused: boolean): string {
    const { inputValue, cursor } = state;
    const before = inputValue.slice(0, cursor);
    const at     = inputValue[cursor] ?? ' ';
    const after  = inputValue.slice(cursor + 1);

    const cursorDisplay = focused
        ? before + chalk.inverse(at) + after
        : before + at + after;

    const displayValue = inputValue.length > 0
        ? cursorDisplay
        : (!config.fastSubmit && config.placeholder ? chalk.dim(config.placeholder) : '');

    return displayValue;
}

/**
 * Handle a keypress event for the text-input portion.
 * Calls `submitFn` when the user confirms with Enter.
 * Returns true if the key was consumed.
 */
function handleInputKey(
    key: { name?: string; ctrl?: boolean; sequence?: string },
    state: InputState,
    setState: {
        setInputValue: (v: string) => void;
        setCursor: (v: number) => void;
        setError: (v: string) => void;
    },
    config: InputConfig,
    submitFn: (value: string) => void,
): boolean {
    const { inputValue, cursor } = state;
    const { setInputValue, setCursor, setError } = setState;

    if (isEnterKey(key as any)) {
        const validation = config.validate?.(inputValue);
        if (validation !== undefined && validation !== true) {
            setError(typeof validation === 'string' ? validation : 'Invalid value');
            return true;
        }
        setError('');
        submitFn(inputValue);
        return true;

    } else if (key.name === 'backspace') {
        if (cursor > 0) {
            setInputValue(inputValue.slice(0, cursor - 1) + inputValue.slice(cursor));
            setCursor(cursor - 1);
        }
        setError('');
        return true;

    } else if (key.name === 'delete') {
        if (cursor < inputValue.length) {
            setInputValue(inputValue.slice(0, cursor) + inputValue.slice(cursor + 1));
        }
        setError('');
        return true;

    } else if (key.name === 'left') {
        if (cursor > 0) setCursor(cursor - 1);
        return true;

    } else if (key.name === 'right') {
        if (cursor < inputValue.length) setCursor(cursor + 1);
        return true;

    } else if (key.name === 'home' || (key.ctrl && key.name === 'a')) {
        setCursor(0);
        return true;

    } else if (key.name === 'end' || (key.ctrl && key.name === 'e')) {
        setCursor(inputValue.length);
        return true;

    } else if (key.name && key.name.length === 1 && !key.ctrl) {
        const next = inputValue.slice(0, cursor) + key.name + inputValue.slice(cursor);
        setInputValue(next);
        setCursor(cursor + 1);
        setError('');
        return true;
    }

    return false;
}

/**
 * Standard multi-line input prompt with "?" prefix.
 */
const input = createPrompt<string, InputConfig>((config, done) => {
    const initial = config.value ?? '';

    const [inputValue, setInputValue] = useState<string>(initial);
    const [cursor, setCursor]         = useState<number>(initial.length);
    const [error, setError]           = useState<string>('');
    const [status, setStatus]         = useState<'pending' | 'done'>('pending');
    const prefix = usePrefix({ status });

    useKeypress((key) => {
        if (config.fastSubmit) {
            setStatus('done');
            done(inputValue);
            return;
        }

        handleInputKey(
            key,
            { inputValue, cursor, error },
            { setInputValue, setCursor, setError },
            config,
            (value) => {
                setStatus('done');
                done(value);
            },
        );
    });

    const displayValue = renderInputLine({ inputValue, cursor, error }, config, true);
    const lines = [`${prefix} ${chalk.bold(config.message)} ${displayValue}`];
    if (error) lines.push(chalk.red(`  > ${error}`));

    return lines.join('\n');
});

/**
 * Inline single-keypress prompt: renders "message ▌" on one line, waits for
 * any key, then clears the line entirely — no "?" prefix, no trailing newline.
 * Only makes sense with fastSubmit: true.
 */
const inputInline = createPrompt<string, InputConfig>((config, done) => {
    const [pressed, setPressed] = useState<boolean>(false);

    useKeypress((key) => {
        if (!pressed) {
            setPressed(true);
            done((key as any).sequence ?? '');
        }
    });

    if (pressed) {
        // Return empty string: @inquirer/core will print this and add ONE \n.
        // We counteract that newline with a \x1b[1A\r\x1b[2K (move up + erase).
        return '\x1b[1A\r\x1b[2K';
    }

    // Show "message ▌" — the blinking block acts as the cursor indicator
    return `${chalk.bold(config.message)} ${chalk.inverse(' ')}`;
});

export { input, inputInline, type InputConfig, type InputState, renderInputLine, handleInputKey };