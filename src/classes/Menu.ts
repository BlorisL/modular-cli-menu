import inquirer from 'inquirer';
import { MenuItem } from '@classes/MenuItem';
import { LanguageManager } from '@classes/LanguageManager';
import { debugLog, waitForKeyPress } from '@utils/functions';
import { findParentMenu } from '@utils/functions';

export class Menu {
    private id: string;
    private translationKey: string;
    private languageManager: LanguageManager;
    private items: MenuItem[] = [];

    constructor(id: string, translationKey: string, languageManager: LanguageManager) {
        this.id = id;
        this.translationKey = translationKey;
        this.languageManager = languageManager;
    }

    public getId(): string {
        return this.id;
    }

    public addItem(item: MenuItem): void {
        debugLog(`Added item ${item.id} to menu ${this.id}, type: ${item.constructor.name}`);
        if (item.id === 'exit' || item.id === 'back') {
            this.items.push(item);
        } else {
            this.items.unshift(item);
        }
    }

    public async display(menus: Map<string, Menu>, mainMenu: Menu): Promise<void> {
        console.clear();
        const choices = this.items.map((item) => ({
            name: this.languageManager.getTranslation(item.translationKey),
            value: item
        }));

        debugLog(`Choices for menu ${this.id}: [${choices.map(c => c.name).join(', ')}]`);

        const { selectedItem } = await inquirer.prompt([
            {
                type: 'list',
                name: 'selectedItem',
                message: this.languageManager.getTranslation(this.translationKey),
                choices
            }
        ]);

        debugLog(`Selected item: ${selectedItem.id}, type: ${selectedItem.constructor.name}`);

        if (!(selectedItem instanceof MenuItem)) {
            debugLog('Error: selectedItem is not a MenuItem:', selectedItem);
            return;
        }

        if (selectedItem.submenu) {
            await selectedItem.submenu.display(menus, mainMenu);
        } else if (typeof selectedItem.getAction === 'function') {
            const action = selectedItem.getAction();
            if (action) {
                debugLog(`Executing action for ${selectedItem.id}`);
                await action(mainMenu, this.languageManager, this, menus);
            } else {
                debugLog(`No action defined for ${selectedItem.id}`);
            }
        } else {
            debugLog(`Error: getAction is not a function for ${selectedItem.id}`);
        }

        if (selectedItem.navigation === 'waitAndContinue') {
            debugLog(`Navigation waitAndContinue for ${selectedItem.id}, returning to main menu`);
            await mainMenu.display(menus, mainMenu);
        } else if (selectedItem.navigation === 'home') {
            await mainMenu.display(menus, mainMenu);
        } else if (selectedItem.navigation === 'previous') {
            const parentMenu = await findParentMenu(this, menus);
            debugLog(`Previous navigation from ${this.id} to ${parentMenu?.getId() || 'main'}`);
            if (parentMenu) {
                await parentMenu.display(menus, mainMenu);
            } else {
                await mainMenu.display(menus, mainMenu);
            }
        }
    }
}