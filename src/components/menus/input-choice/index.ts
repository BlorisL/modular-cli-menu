import { Choice } from "@/prompts/Choices";
import { InputConfig, InputState, renderInputLine, handleInputKey } from "@/prompts/Input";
import { createPrompt, useState, useKeypress, usePrefix, isEnterKey, Separator } from '@inquirer/core';
import chalk from 'chalk';

interface InputChoiceConfig extends InputConfig {
    choices: (Choice | Separator)[];
}

type InputChoiceResult = { type: 'input'; value: string } | { type: 'choice'; value: string };

const isSeparator = (item: any): boolean =>
    item && typeof item === 'object' &&
    ('separator' in item || ('type' in item && item.type === 'separator'));

const inputChoice = createPrompt<InputChoiceResult, InputChoiceConfig>((config, done) => {
    const { message } = config;
    const initial = config.value ?? '';

    // choices is stable (passed once), safe to use directly
    const allItems = config.choices;
    const firstSelectableIndex = allItems.findIndex(i => !isSeparator(i));

    const [inputValue, setInputValue] = useState<string>(initial);
    const [cursor, setCursor]         = useState<number>(initial.length);
    const [error, setError]           = useState<string>('');
    const [status, setStatus]         = useState<'pending' | 'done'>('pending');
    const [focus, setFocus]           = useState<'input' | 'list'>('input');
    const [activeIndex, setActiveIndex] = useState<number>(
        firstSelectableIndex >= 0 ? firstSelectableIndex : 0
    );
    const prefix = usePrefix({ status });

    useKeypress((key) => {
        if (config.fastSubmit) {
            setStatus('done');
            done({ type: 'input', value: inputValue });
            return;
        }

        if (focus === 'input') {
            // ↓ or Tab → enter list at first item
            if (key.name === 'down' || key.name === 'tab') {
                if (allItems.length > 0) {
                    setFocus('list');
                    setActiveIndex(firstSelectableIndex >= 0 ? firstSelectableIndex : 0);
                }
                return;
            }
            // ↑ from input → wrap to last selectable item
            if (key.name === 'up') {
                if (allItems.length > 0) {
                    setFocus('list');
                    let idx = allItems.length - 1;
                    while (idx >= 0 && isSeparator(allItems[idx])) idx--;
                    if (idx >= 0) setActiveIndex(idx);
                }
                return;
            }
            // all other keys: text editing
            handleInputKey(
                key,
                { inputValue, cursor, error },
                { setInputValue, setCursor, setError },
                config,
                (value) => { setStatus('done'); done({ type: 'input', value }); },
            );
        } else {
            // focus === 'list'

            // Escape or Tab → back to input
            if (key.name === 'escape' || key.name === 'tab') {
                setFocus('input');
                return;
            }

            if (key.name === 'up') {
                // At first selectable item → back to input
                if (activeIndex === firstSelectableIndex) {
                    setFocus('input');
                    return;
                }
                // Otherwise move up, skip separators
                let idx = activeIndex - 1;
                while (idx >= 0 && isSeparator(allItems[idx])) idx--;
                if (idx >= 0) setActiveIndex(idx);
                return;
            }

            if (key.name === 'down') {
                let idx = activeIndex + 1;
                while (idx < allItems.length && isSeparator(allItems[idx])) idx++;
                // At last item → wrap back to input
                if (idx >= allItems.length) {
                    setFocus('input');
                } else {
                    setActiveIndex(idx);
                }
                return;
            }

            if (isEnterKey(key)) {
                const selectedItem = allItems[activeIndex];
                if (!isSeparator(selectedItem)) {
                    setStatus('done');
                    done({ type: 'choice', value: (selectedItem as Choice).value });
                }
                return;
            }
        }
    });

    // ── Render ──────────────────────────────────────────────────────────────

    const inputState: InputState = { inputValue, cursor, error };
    const displayValue = renderInputLine(inputState, config, focus === 'input');
    const focusMarker = focus === 'input' ? chalk.cyan('❯') : ' ';

    const lines = [
        `${prefix} ${chalk.bold(message)}`,
        `${focusMarker} ${displayValue}`,
    ];
    if (error) lines.push(chalk.red(`  > ${error}`));

    if (!config.fastSubmit) {
        // Add separator only if the first item is NOT already a separator
        if (allItems.length > 0 && !isSeparator(allItems[0])) {
            lines.push(new Separator().separator);
        }

        allItems.forEach((item, index) => {
            if (isSeparator(item)) {
                lines.push(new Separator().separator);
            } else {
                const choice = item as Choice;
                const isActive = focus === 'list' && index === activeIndex;
                lines.push(`${isActive ? chalk.cyan('❯') : ' '} ${choice.label}`);
            }
        });
    }

    return lines.join('\n');
});

export { inputChoice, type InputChoiceConfig, type InputChoiceResult };