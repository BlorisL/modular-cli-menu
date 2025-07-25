import { createPrompt, useState, useKeypress, usePrefix, isEnterKey, isSpaceKey, Separator } from '@inquirer/core';
import chalk from 'chalk';

interface Choice {
    name: string;
    value: string;
    isMulti: boolean;
}

interface Config {
    message: string;
    choices: (Choice | Separator)[];
}

type PromptValue = string[] | { action: string };
type Item = Choice | Separator;

export const choices = createPrompt<PromptValue, Config>(
    (config: Config, done: (value: PromptValue) => void) => {
        const { message, choices } = config;
        const [selected, setSelected] = useState<Set<string>>(new Set());
        const [activeIndex, setActiveIndex] = useState<number>(0);
        const [status, setStatus] = useState<'pending' | 'done'>('pending');
        const prefix = usePrefix({ status });

        const allItems: Item[] = [...choices];

        useKeypress((key) => {
            if (isEnterKey(key)) {
                const selectedItem = allItems[activeIndex];
                if (!(selectedItem instanceof Separator)) {
                    if (selectedItem.isMulti) {
                        setStatus('done');
                        done(Array.from(selected));
                    } else {
                        setStatus('done');
                        done([typeof selectedItem === 'string' ? selectedItem : selectedItem.value ]);
                    }
                }
            } else if (isSpaceKey(key)) {
                const choice = allItems[activeIndex];
                if (!(choice instanceof Separator) && choice.isMulti) {
                    const choiceValue = choice.value;
                    const newSelected = new Set(selected);
                    if (newSelected.has(choiceValue)) {
                        newSelected.delete(choiceValue);
                    } else {
                        newSelected.add(choiceValue);
                    }
                    setSelected(newSelected);
                }
            } else if (key.name === 'up') {
                let newIndex = activeIndex === 0 ? allItems.length - 1 : activeIndex - 1;
                while (allItems[newIndex] instanceof Separator && newIndex !== activeIndex) {
                    newIndex = newIndex === 0 ? allItems.length - 1 : newIndex - 1;
                }
                setActiveIndex(newIndex);
            } else if (key.name === 'down') {
                let newIndex = activeIndex === allItems.length - 1 ? 0 : activeIndex + 1;
                while (allItems[newIndex] instanceof Separator && newIndex !== activeIndex) {
                    newIndex = newIndex === allItems.length - 1 ? 0 : newIndex + 1;
                }
                setActiveIndex(newIndex);
            }
        });

        const lines = [`${prefix} ${message}`];

        // Rendering
        allItems.forEach((item, index) => {
            const isActive = index === activeIndex;

            if (item instanceof Separator) {
                lines.push(new Separator().separator);
            } else {
                const choice = item as Choice;
                if (choice.isMulti) {
                    const isChecked = selected.has(choice.value);
                    const checkbox = isChecked ? chalk.green('◉') : '◯';
                    const prefix = isActive ? chalk.cyan('❯') : ' ';
                    lines.push(`${prefix} ${checkbox} ${choice.name}`);
                } else {
                    const prefix = isActive ? chalk.cyan('❯') : ' ';
                    lines.push(`${prefix} ${choice.name}`);
                }
            }
        });

        return lines.join('\n');
    }
);