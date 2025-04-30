import inquirer from 'inquirer';
import { Menu } from '@classes/Menu';
import { LanguageManager } from '@classes/LanguageManager';
import { debugLog } from './functions';

// Custom types to avoid problems with inquirer
interface PromptChoice {
    name: string;
    value: string;
}

interface PromptQuestion {
    type?: string;
    name: string;
    message: string;
    choices?: PromptChoice[] | ((answers: any) => PromptChoice[]);
}

type PromptQuestions = PromptQuestion | PromptQuestion[];
type PromptResult<T> = Promise<T | undefined>;

export async function promptWithBack<T>(
    questions: PromptQuestions,
    mainMenu: Menu,
    languageManager: LanguageManager,
    currentMenu: Menu,
    menus: Map<string, Menu>
): PromptResult<T> {
    // Clone questions to avoid modifying the original
    const clonedQuestions = Array.isArray(questions) ? [...questions] : [{ ...questions }];

    // Add the "Go Back" option only for prompts of type 'list'
    for (const question of clonedQuestions) {
        if (question.type === 'list' && question.choices) {
            let choicesArray: PromptChoice[];
            if (typeof question.choices === 'function') {
                choicesArray = question.choices({});
            } else {
                choicesArray = [...question.choices];
            }
            choicesArray.push({
                name: languageManager.getTranslation('main_menu.back'),
                value: 'back'
            });
            question.choices = choicesArray;
        }
    }

    // Execute the prompt
    const answers = await inquirer.prompt(clonedQuestions);

    // Handle the "Go Back" selection
    for (const key in answers) {
        if (answers[key] === 'back') {
            debugLog(`Back option selected from ${currentMenu.getId()}, returning to current menu`);
            await currentMenu.display(menus, mainMenu);
            return undefined;
        }
    }

    return answers as T;
}