import * as fs from 'fs';
import * as path from 'path';
import readline from 'readline';
import * as dotenv from 'dotenv';
import { Menu } from '@classes/Menu';
import { LanguageManager } from '@classes/LanguageManager';

export function loadEnvFiles() {
    const envPath = path.resolve(process.cwd(), '.env');
    const envLocalPath = path.resolve(process.cwd(), '.env.local');

    // Load .env first
    if (fs.existsSync(envPath)) {
        dotenv.config({ path: envPath });
    }

    // Then load .env.local, which overrides any variables already loaded
    if (fs.existsSync(envLocalPath)) {
        dotenv.config({ path: envLocalPath, override: true });
    }
}

export function debugLog(...args: any[]): void {
    if (process.env.DEBUG_LOG === 'true') {
        console.log(...args);
    }
}

export async function findParentMenu(currentMenu: Menu, menus: Map<string, Menu>): Promise<Menu | undefined> {
    const currentId = currentMenu.getId();
    debugLog(`Searching for parent menu: ${currentId}, available menus: [${Array.from(menus.keys()).join(', ')}]`);
    for (const [id, menu] of menus) {
        for (const item of menu['items']) {
            if (item.submenu && item.submenu.getId() === currentId) {
                debugLog(`Parent found: ${id} for submenu ${currentId}`);
                return menu;
            }
            if (item.id === currentId && item.parentId) {
                debugLog(`Parent found: ${item.parentId} for item ${currentId}`);
                return menus.get(item.parentId);
            }
        }
    }
    debugLog(`No parent found for ${currentId}`);
    return undefined;
}

export async function waitForKeyPress(languageManager: LanguageManager): Promise<void> {
    debugLog('Executing waitForKeyPress');
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    return new Promise((resolve) => {
        rl.question(languageManager.getTranslation('actions.wait_for_keypress'), () => {
            rl.close();
            resolve();
        });
    });
}