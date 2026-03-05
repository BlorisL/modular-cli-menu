import {
    createPrompt,
    useState,
    useKeypress,
    usePrefix,
    isEnterKey,
    isSpaceKey,
    Separator,
} from '@inquirer/core';
import chalk from 'chalk';

// Types

export interface Choice {
    value: string;
    label: string;
    multi: boolean;
}

export type PromptValue = string[] | { action: string };

export interface PromptConfig {
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
}

export type PromptResult =
    | { type: 'input';   value: string   }
    | { type: 'choice';  value: string   }
    | { type: 'choices'; values: string[] };

export interface InputState {
    inputValue: string;
    cursor: number;
    error: string;
}

// Helpers

export const isSeparator = (item: any): boolean =>
    item != null &&
    typeof item === 'object' &&
    ('separator' in item || ('type' in item && item.type === 'separator'));

export function renderInputLine(
    state: InputState,
    config: { placeholder?: string; fastSubmit?: boolean },
    focused: boolean,
): string {
    const { inputValue, cursor } = state;
    const before = inputValue.slice(0, cursor);
    const at     = inputValue[cursor] ?? ' ';
    const after  = inputValue.slice(cursor + 1);

    const cursorDisplay = focused
        ? before + chalk.inverse(at) + after
        : before + at + after;

    return inputValue.length > 0
        ? cursorDisplay
        : (!config.fastSubmit && config.placeholder ? chalk.dim(config.placeholder) : '');
}

export function handleInputKey(
    key: { name?: string; ctrl?: boolean; sequence?: string },
    state: InputState,
    setState: {
        setInputValue: (v: string) => void;
        setCursor:     (v: number) => void;
        setError:      (v: string) => void;
    },
    config: { validate?: (value: string) => boolean | string },
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

export function renderChoiceLines(
    items: (Choice | Separator)[],
    activeIndex: number,
    focusedOnList: boolean,
    selected?: Set<string>,
): string[] {
    return items.map((item, index) => {
        if (isSeparator(item)) return new Separator().separator;
        const choice = item as Choice;
        const isActive = focusedOnList && index === activeIndex;
        const prefix = isActive ? chalk.cyan('❯') : ' ';
        if (choice.multi && selected) {
            const isChecked = selected.has(choice.value);
            const checkbox = isChecked ? chalk.green('◉') : '◯';
            return `${prefix} ${checkbox} ${choice.label}`;
        }
        return `${prefix} ${choice.label}`;
    });
}

const prompt = createPrompt<PromptResult, PromptConfig>((config, done) => {
    const { message, input: inputCfg, choices: choicesCfg } = config;

    const hasInput   = !!inputCfg;
    const hasChoices = !!choicesCfg && choicesCfg.length > 0;

    // Input state
    const initial = inputCfg?.value ?? '';
    const [inputValue, setInputValue] = useState<string>(initial);
    const [cursor, setCursor]         = useState<number>(initial.length);
    const [error, setError]           = useState<string>('');

    // Choices state
    const allItems = choicesCfg ?? [];
    const firstSelectable = allItems.findIndex(i => !isSeparator(i));
    const [selected, setSelected]       = useState<Set<string>>(new Set());
    const [activeIndex, setActiveIndex] = useState<number>(
        firstSelectable >= 0 ? firstSelectable : 0
    );

    // Focus: 'input' | 'list', only meaningful when both sections are active
    const [focus, setFocus] = useState<'input' | 'list'>(hasInput ? 'input' : 'list');

    const [status, setStatus] = useState<'pending' | 'done'>('pending');
    const prefix = usePrefix({ status });

    useKeypress((key) => {
        // inline fastSubmit (input only, no choices)
        if (hasInput && inputCfg!.fastSubmit && inputCfg!.inline && !hasChoices) {
            if (status !== 'done') {
                setStatus('done');
                done({ type: 'input', value: inputValue });
            }
            return;
        }

        // fastSubmit without inline
        if (hasInput && inputCfg!.fastSubmit && !hasChoices) {
            setStatus('done');
            done({ type: 'input', value: inputValue });
            return;
        }

        // choices only (no input section)
        if (!hasInput && hasChoices) {
            if (isEnterKey(key)) {
                const item = allItems[activeIndex];
                if (!isSeparator(item)) {
                    const choice = item as Choice;
                    if (choice.multi) {
                        setStatus('done');
                        done({ type: 'choices', values: Array.from(selected) });
                    } else {
                        setStatus('done');
                        done({ type: 'choice', value: choice.value });
                    }
                }
            } else if (isSpaceKey(key)) {
                const item = allItems[activeIndex];
                if (!isSeparator(item) && (item as Choice).multi) {
                    const val = (item as Choice).value;
                    const next = new Set(selected);
                    next.has(val) ? next.delete(val) : next.add(val);
                    setSelected(next);
                }
            } else if (key.name === 'up') {
                let i = activeIndex === 0 ? allItems.length - 1 : activeIndex - 1;
                while (isSeparator(allItems[i]) && i !== activeIndex)
                    i = i === 0 ? allItems.length - 1 : i - 1;
                setActiveIndex(i);
            } else if (key.name === 'down') {
                let i = activeIndex === allItems.length - 1 ? 0 : activeIndex + 1;
                while (isSeparator(allItems[i]) && i !== activeIndex)
                    i = i === allItems.length - 1 ? 0 : i + 1;
                setActiveIndex(i);
            }
            return;
        }

        // combo: input + choices
        if (focus === 'input') {
            if (key.name === 'down' || key.name === 'tab') {
                if (hasChoices) {
                    setFocus('list');
                    setActiveIndex(firstSelectable >= 0 ? firstSelectable : 0);
                }
                return;
            }
            if (key.name === 'up' && hasChoices) {
                setFocus('list');
                let idx = allItems.length - 1;
                while (idx >= 0 && isSeparator(allItems[idx])) idx--;
                if (idx >= 0) setActiveIndex(idx);
                return;
            }
            handleInputKey(
                key,
                { inputValue, cursor, error },
                { setInputValue, setCursor, setError },
                { validate: inputCfg?.validate },
                (value) => { setStatus('done'); done({ type: 'input', value }); },
            );
        } else {
            // focus === 'list'
            if (key.name === 'escape' || key.name === 'tab') {
                setFocus('input');
                return;
            }
            if (key.name === 'up') {
                if (activeIndex === firstSelectable) { setFocus('input'); return; }
                let idx = activeIndex - 1;
                while (idx >= 0 && isSeparator(allItems[idx])) idx--;
                if (idx >= 0) setActiveIndex(idx);
                return;
            }
            if (key.name === 'down') {
                let idx = activeIndex + 1;
                while (idx < allItems.length && isSeparator(allItems[idx])) idx++;
                if (idx >= allItems.length) { setFocus('input'); }
                else { setActiveIndex(idx); }
                return;
            }
            if (isEnterKey(key)) {
                const item = allItems[activeIndex];
                if (!isSeparator(item)) {
                    setStatus('done');
                    done({ type: 'choice', value: (item as Choice).value });
                }
            }
        }
    });

    // Render

    const lines: string[] = [];

    if (hasInput) {
        // inline fastSubmit: single line, no prefix
        if (inputCfg!.fastSubmit && inputCfg!.inline && !hasChoices) {
            if (status === 'done') return '\x1b[1A\r\x1b[2K';
            return `${chalk.bold(message)} ${chalk.inverse(' ')}`;
        }

        const inputState: InputState = { inputValue, cursor, error };
        const displayValue = renderInputLine(inputState, inputCfg!, focus === 'input' || !hasChoices);
        const focusMarker  = (hasChoices && focus !== 'input') ? ' ' : chalk.cyan('❯');

        if (hasChoices) {
            // combo: header line + input line separate
            lines.push(`${prefix} ${chalk.bold(message)}`);
            lines.push(`${focusMarker} ${displayValue}`);
        } else {
            // input only: classic single-line look
            lines.push(`${prefix} ${chalk.bold(message)} ${displayValue}`);
        }
        if (error) lines.push(chalk.red(`  > ${error}`));
    } else {
        // choices only: classic header
        lines.push(`${prefix} ${message}`);
    }

    if (hasChoices) {
        if (hasInput && allItems.length > 0 && !isSeparator(allItems[0])) {
            lines.push(new Separator().separator);
        }
        lines.push(...renderChoiceLines(allItems, activeIndex, focus === 'list', selected));
    }

    return lines.join('\n');
});

export { prompt, Separator };