import inquirer from 'inquirer';
import fs from 'fs/promises';
import path from 'path';
import { LanguageManager } from '@classes/LanguageManager';
import { Menu } from '@classes/Menu';
import { MenuItem } from '@classes/MenuItem';
import { MenuItemConfig } from '@interfaces/MenuItemConfig';
import { CustomAction } from '@interfaces/CustomAction';
import { debugLog, findParentMenu, loadEnvFiles } from '@utils/functions';

loadEnvFiles();

// Cache for loaded actions
const actionCache = new Map<string, CustomAction>();

// Function to load menus from plugins
async function loadMenus(languageManager: LanguageManager): Promise<Map<string, Menu>> {
    const menus = new Map<string, Menu>();
    const menuItems = new Map<string, MenuItem>();

    // Load the main menu
    const mainMenuFile = path.join(__dirname, 'plugins', 'main', 'menu.json');
    let mainMenuConfigs: MenuItemConfig[] = [];
    if (await fs.access(mainMenuFile).then(() => true).catch(() => false)) {
        const data = await fs.readFile(mainMenuFile, 'utf-8');
        mainMenuConfigs = JSON.parse(data);
        debugLog(`Loaded main menu from ${mainMenuFile}`);
    } else {
        debugLog('Main menu.json file not found, creating empty menu');
        mainMenuConfigs = [{ id: 'main', translationKey: 'main_menu.title', submenu: [] }];
    }

    // Create menus from the main file
    for (const config of mainMenuConfigs) {
        if (config.submenu || config.id === 'main') {
            const menu = new Menu(config.id, config.translationKey, languageManager);
            menus.set(config.id, menu);
        }
    }

    // Create the main menu items
    for (const config of mainMenuConfigs) {
        if (config.actionId) {
            let action: CustomAction | undefined;
            // Handle showInfo as a plugin action
            const pluginName = config.pluginName || 'main';
            action = await loadAction(pluginName, config.actionId);
            if (!action) {
                debugLog(`Action ${config.actionId} not loaded for ${config.id}`);
            }

            debugLog(`Creating MenuItem ${config.id} with action ${config.actionId}`);

            const menuItem = new MenuItem(
                config.id,
                config.translationKey,
                action,
                config.submenu ? menus.get(config.id) : undefined,
                config.parentId,
                config.navigation
            );

            menuItems.set(config.id, menuItem);

            // Add the item to the parent menu
            if (config.parentId) {
                const parentMenu = menus.get(config.parentId);
                if (parentMenu) {
                    parentMenu.addItem(menuItem);
                } else {
                    debugLog(`Parent menu ${config.parentId} not found for ${config.id}`);
                }
            } else {
                const mainMenu = menus.get('main');
                if (mainMenu) {
                    mainMenu.addItem(menuItem);
                }
            }
        }
    }

    // Load menus from plugins
    const pluginsDir = path.resolve(__dirname, 'plugins');
    let pluginFolders: string[] = [];
    try {
        pluginFolders = await fs.readdir(pluginsDir);
    } catch (error) {
        debugLog('No plugins found in plugins/ directory');
    }

    for (const folder of pluginFolders) {
        // Skip main plugin as it was already loaded
        if (folder === 'main') continue;
        
        const menuFile = path.join(pluginsDir, folder, 'menu.json');
        if (await fs.access(menuFile).then(() => true).catch(() => false)) {
            const data = await fs.readFile(menuFile, 'utf-8');
            const menuConfigs: MenuItemConfig[] = JSON.parse(data);

            // Create menus
            for (const config of menuConfigs) {
                if (config.submenu) {
                    const menu = new Menu(config.id, config.translationKey, languageManager);
                    menus.set(config.id, menu);
                }
            }

            // Create menu items and associate actions
            for (const config of menuConfigs) {
                let action: CustomAction | undefined;
                if (config.actionId) {
                    action = await loadAction(folder, config.actionId);
                    if (!action) {
                        debugLog(`Action ${config.actionId} not loaded for ${config.id}`);
                    }
                }

                debugLog(`Creating MenuItem ${config.id} with action ${config.actionId || 'none'}`);

                const menuItem = new MenuItem(
                    config.id,
                    config.translationKey,
                    action,
                    config.submenu ? menus.get(config.id) : undefined,
                    config.parentId,
                    config.navigation
                );

                menuItems.set(config.id, menuItem);

                // Add the item to the parent menu
                if (config.parentId) {
                    const parentMenu = menus.get(config.parentId);
                    if (parentMenu) {
                        parentMenu.addItem(menuItem);
                    } else {
                        debugLog(`Parent menu ${config.parentId} not found for ${config.id}`);
                    }
                }
            }
        }
    }

    // Automatically add a "Go Back" entry to all submenus
    for (const [menuId, menu] of menus) {
        if (menuId !== 'main') {
            const hasParent = Array.from(menus.values()).some((m) =>
                m['items'].some((item: MenuItem) => item.submenu && item.submenu.getId() === menuId)
            );
            if (hasParent) {
                const backAction = await loadAction('main', 'back');
                if (backAction) {
                    debugLog(`Associating back action to MenuItem back for menu ${menuId}`);
                    const backItem = new MenuItem(
                        'back',
                        'main_menu.back',
                        backAction,
                        undefined,
                        menuId,
                        'previous'
                    );
                    menu.addItem(backItem);
                    debugLog(`Added "Back" entry to menu ${menuId} with back action`);
                } else {
                    debugLog(`"back" action not loaded for menu ${menuId}`);
                }
            }
        }
    }

    debugLog(`Loaded menus: ${Array.from(menus.keys()).join(', ')}`);
    return menus;
}

// Function to load custom actions
async function loadAction(pluginName: string, actionId: string): Promise<CustomAction | undefined> {
    const cacheKey = `${pluginName}/${actionId}`;
    if (actionCache.has(cacheKey)) {
        debugLog(`Action ${cacheKey} loaded from cache`);
        return actionCache.get(cacheKey);
    }

    try {
        let actionPath: string;
        if (actionId === 'back' || actionId === 'exit') {
            actionPath = path.join(__dirname, 'plugins', 'main', 'actions', actionId);
            debugLog(`Loading main action: ${actionPath}`);
        } else {
            actionPath = path.join(__dirname, 'plugins', pluginName, 'actions', actionId);
            debugLog(`Loading plugin action: ${actionPath}`);
        }

        const actionModule = await import(actionPath);
        const action = actionModule.default as CustomAction;
        if (typeof action !== 'function') {
            throw new Error(`Action ${actionId} is not a valid function`);
        }
        debugLog(`Action ${cacheKey} loaded successfully`);
        actionCache.set(cacheKey, action);
        return action;
    } catch (error) {
        debugLog(`Error loading action ${pluginName}/${actionId}:`, error);
        return undefined;
    }
}

// Main function to start the application
async function main() {
    debugLog(`DEBUG_LOG set to: ${process.env.DEBUG_LOG}`);
    const languageManager = new LanguageManager();

    // Load the default language (e.g. Italian)
    await languageManager.loadLanguage(process.env.LANGUAGE || 'en');

    // Load menus
    const menus = await loadMenus(languageManager);

    // Start the main menu
    const mainMenu = menus.get('main');
    if (mainMenu) {
        await mainMenu.display(menus, mainMenu);
    } else {
        debugLog('Main menu not found.');
        process.exit(1);
    }
}

// Start the application
main().catch((error) => {
    debugLog('Error:', error);
});