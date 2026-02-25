import { createPrompt, useState, useKeypress, usePrefix, isEnterKey } from '@inquirer/core';
import chalk from 'chalk';

interface InputConfig {
    message: string;
    value?: string;
    placeholder?: string;
    fastSubmit?: boolean;
    validate?: (value: string) => boolean | string;
}

const input = createPrompt<string, InputConfig>((config, done) => {
    const { message, placeholder } = config;
    const initial = config.value ?? '';

    // cursor position within `input`
    const [input, setInput] = useState<string>(initial);
    const [cursor, setCursor] = useState<number>(initial.length);
    const [error, setError] = useState<string>('');
    const [status, setStatus] = useState<'pending' | 'done'>('pending');
    const prefix = usePrefix({ status });

    useKeypress((key) => {
        if (config.fastSubmit) {
            setStatus('done');
            done(input);
            return;
        }

        if (isEnterKey(key)) {
            const validation = config.validate?.(input);
            if (validation !== undefined && validation !== true) {
                setError(typeof validation === 'string' ? validation : 'Invalid value');
                return;
            }
            setError('');
            setStatus('done');
            done(input);

        } else if (key.name === 'backspace') {
            if (cursor > 0) {
                setInput(input.slice(0, cursor - 1) + input.slice(cursor));
                setCursor(cursor - 1);
            }
            setError('');

        } else if (key.name === 'delete') {
            if (cursor < input.length) {
                setInput(input.slice(0, cursor) + input.slice(cursor + 1));
            }
            setError('');

        } else if (key.name === 'left') {
            if (cursor > 0) setCursor(cursor - 1);

        } else if (key.name === 'right') {
            if (cursor < input.length) setCursor(cursor + 1);

        } else if (key.name === 'home' || (key.ctrl && key.name === 'a')) {
            setCursor(0);

        } else if (key.name === 'end' || (key.ctrl && key.name === 'e')) {
            setCursor(input.length);

        } else if (key.name && key.name.length === 1 && !key.ctrl) {
            const next = input.slice(0, cursor) + key.name + input.slice(cursor);
            setInput(next);
            setCursor(cursor + 1);
            setError('');
        }
    });

    // Render: split at cursor to show a blinking-style cursor block
    const before = input.slice(0, cursor);
    const at     = input[cursor] ?? ' ';
    const after  = input.slice(cursor + 1);

    const displayValue = input.length > 0 || status === 'done'
        ? before + at + after
        : ((!config.fastSubmit && placeholder) ? chalk.dim(placeholder) : '');

    const lines = [`${prefix} ${chalk.bold(message)} ${displayValue}`];
    if (error) lines.push(chalk.red(`  > ${error}`));

    return lines.join('\n');
});

export { input, type InputConfig };