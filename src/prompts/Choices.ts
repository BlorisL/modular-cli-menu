import { createPrompt, useState, useKeypress, usePrefix, isEnterKey, isSpaceKey, Separator } from '@inquirer/core';
import chalk from 'chalk';

export interface Choice {
    value: string;
    label: string;
    multi: boolean;
}

interface Config {
    message: string;
    choices: (Choice | Separator)[];
}

export type PromptValue = string[] | { action: string };
type Item = Choice | Separator;

// Helper function to safely check if an item is a Separator
const isSeparator = (item: any): boolean => {
    return item && typeof item === 'object' && 
           ('separator' in item || 'type' in item && item.type === 'separator');
};

const choices = createPrompt<PromptValue, Config>(
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
                if (!isSeparator(selectedItem)) {
                    // Type cast to Choice since we know it's not a Separator
                    const choiceItem = selectedItem as Choice;
                    if (choiceItem.multi) {
                        setStatus('done');
                        done(Array.from(selected));
                    } else {
                        setStatus('done');
                        done([choiceItem.value]);
                    }
                }
            } else if (isSpaceKey(key)) {
                const choice = allItems[activeIndex];
                if (!isSeparator(choice) && (choice as Choice).multi) {
                    const choiceItem = choice as Choice;
                    const choiceValue = choiceItem.value;
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
                while (isSeparator(allItems[newIndex]) && newIndex !== activeIndex) {
                    newIndex = newIndex === 0 ? allItems.length - 1 : newIndex - 1;
                }
                setActiveIndex(newIndex);
            } else if (key.name === 'down') {
                let newIndex = activeIndex === allItems.length - 1 ? 0 : activeIndex + 1;
                while (isSeparator(allItems[newIndex]) && newIndex !== activeIndex) {
                    newIndex = newIndex === allItems.length - 1 ? 0 : newIndex + 1;
                }
                setActiveIndex(newIndex);
            }
        });

        const lines = [`${prefix} ${message}`];

        // Rendering
        allItems.forEach((item, index) => {
            const isActive = index === activeIndex;

            // Check if the item is a Separator using the helper function
            if (isSeparator(item)) {
                lines.push(new Separator().separator);
            } else {
                const choice = item as Choice;
                if (choice.multi) {
                    const isChecked = selected.has(choice.value);
                    const checkbox = isChecked ? chalk.green('◉') : '◯';
                    const prefix = isActive ? chalk.cyan('❯') : ' ';
                    lines.push(`${prefix} ${checkbox} ${choice.label}`);
                } else {
                    const prefix = isActive ? chalk.cyan('❯') : ' ';
                    lines.push(`${prefix} ${choice.label}`);
                }
            }
        });

        return lines.join('\n');
    }
);

export { choices, Separator };