// PluginManager.ts

import { Menu } from "./classes/menus/menu";
import { ChoiceMenu } from "./classes/menus/modes/choice";
import { InputMenu } from "./classes/menus/modes/input";
import { Action } from "./classes/actions/action";
import { FunctionAction } from "./classes/actions/modes/function";
import { GotoAction } from "./classes/actions/modes/goto";
import { BackAction } from "./classes/actions/modes/back";
import { ExitAction } from "./classes/actions/modes/exit";
import { PluginConfig, ActionConfig, MenuConfig } from "./types";
import { Translation } from "./classes/i18n/Translation";

export class PluginManager {
    private menus = new Map<string, Menu>(); // menus registrati globalmente
    private actionMaps = new Map<string, Map<string, Action>>(); // actionMap per plugin (istanze)
    private localMenus = new Map<string, Map<string, Menu>>(); // menu non-registrati per plugin

    constructor(private configs: PluginConfig[]) {}

    addMenu(menu: Menu): void {
        if (this.menus.has(menu.id)) {
            throw new Error(`Menu con id "${menu.id}" già registrato`);
        }
        this.menus.set(menu.id, menu);
    }

    getMenu(id: string): Menu | undefined {
        // cerca prima nei menu registrati
        const registered = this.menus.get(id);
        if (registered) return registered;
        // poi cerca nei localMenus di tutti i plugin
        for (const [, localMap] of this.localMenus) {
            const m = localMap.get(id);
            if (m) return m;
        }
        return undefined;
    }

    async start(entryMenuId: string): Promise<void> {
        const entry = this.getMenu(entryMenuId);
        if (!entry) {
            throw new Error(`Menu di ingresso "${entryMenuId}" non trovato`);
        }
        await entry.render();
    }

    load(): void {
        // processa i plugin nell'ordine delle configs
        this.configs.forEach(config => this.setupPlugin(config));
    }

    private setupPlugin(config: PluginConfig): void {
        // --- 0) estendi le lingue se il plugin ne fornisce
        if (config.translations) {
            Object.entries(config.translations).forEach(([locale, entries]) => {
                Translation.extendLocale(locale as "it" | "en" | "de", entries);
            });
        }
        
        // mappe temporanee per questo plugin
        const actionMap = new Map<string, Action>();
        const localMenuMap = new Map<string, Menu>();
        this.actionMaps.set(config.name, actionMap);
        this.localMenus.set(config.name, localMenuMap);

        // --- 1) crea le istanze di Action (goto con target temporaneo)
        for (const [aid, aConf] of Object.entries(config.actions || {})) {
            let action: Action;
            switch (aConf.type) {
                case "function":
                    action = new FunctionAction(aConf.key, aConf.fn || (() => {}), aConf.after);
                    break;
                case "goto":
                    // target assegnato dopo (null temporaneo)
                    action = new GotoAction(aConf.key, null as any);
                    break;
                case "back":
                    action = new BackAction(aConf.key);
                    break;
                case "exit":
                    action = new ExitAction(aConf.key);
                    break;
                default:
                    throw new Error(`Unknown action type: ${(aConf as any).type}`);
            }
            actionMap.set(aid, action);
        }

        // --- 2) crea le istanze di Menu e le registra / salva localmente
        for (const [mid, mConf] of Object.entries(config.menus || {})) {
            let menu: Menu;
            switch (mConf.type) {
                case "choice":
                    menu = new ChoiceMenu(mConf.id, mConf.key);
                    break;
                case "input":
                    menu = new InputMenu(mConf.id, mConf.key, mConf.onSubmit || (() => {}));
                    break;
                default:
                    throw new Error(`Unknown menu type: ${(mConf as any).type}`);
            }

            // registra globalmente solo se register !== false
            if (mConf.register !== false) {
                this.addMenu(menu);
            } else {
                localMenuMap.set(mConf.id, menu);
            }
        }

        // --- 3) risolvi i target per i goto (ora che tutti i menu di questo plugin sono creati)
        for (const [aid, aConf] of Object.entries(config.actions || {})) {
            if (aConf.type === "goto") {
                const gotoAction = actionMap.get(aid) as GotoAction | undefined;
                if (!gotoAction) continue;
                const targetId = aConf.targetMenuId!;
                const target = this.getMenu(targetId);
                if (!target) {
                    throw new Error(`Target menu ${targetId} not found for action ${aid}`);
                }
                gotoAction.targetMenu = target;
            }
        }

        // --- 4) assegna customActions ai menu (ora i goto hanno target risolto)
        for (const [mid, mConf] of Object.entries(config.menus || {})) {
            const menu = this.getMenu(mConf.id);
            if (!menu) continue;
            if (!mConf.customActions || mConf.customActions.length === 0) continue;

            const choiceMenu = menu as ChoiceMenu;
            for (const aId of mConf.customActions) {
                // cerca l'azione nell'actionMap corrente
                let action = actionMap.get(aId);
                // se non c'è, cerca nelle altre actionMaps (plugin precedenti)
                if (!action) {
                    for (const [, otherMap] of this.actionMaps) {
                        action = otherMap.get(aId);
                        if (action) break;
                    }
                }
                if (!action) {
                    throw new Error(`Action ${aId} not found for menu ${mConf.id}`);
                }
                // evita duplicati: non aggiungere se già presente (stessa istanza)
                const alreadyPresent = choiceMenu.getCustomActions().includes(action);
                if (!alreadyPresent) {
                    choiceMenu.addAction(action);
                }
            }
        }

        // --- 5) aggiungi i goto automatici dai menu figli al loro parent (solo se non già presenti)
        for (const [mid, mConf] of Object.entries(config.menus || {})) {
            if (!mConf.parent) continue;
            const childMenu = this.getMenu(mConf.id);
            if (!childMenu) continue;

            const parentMenu = this.getMenu(mConf.parent);
            if (!parentMenu) {
                throw new Error(`Menu genitore ${mConf.parent} non trovato per il menu ${mConf.id}`);
            }
            const parentChoiceMenu = parentMenu as ChoiceMenu;

            // verifica se esiste già un GotoAction nel parent che punti al child (evita duplicati)
            const exists = parentChoiceMenu.getCustomActions().some(act => {
                return act instanceof GotoAction && act.targetMenu?.id === mConf.id;
            });
            if (!exists) {
                parentChoiceMenu.addAction(new GotoAction(mConf.key, childMenu));
            }
        }

        // --- 6) globalGoto se presente (usa getMenu che cerca anche nei localMenus)
        if (config.globalGoto) {
            const { label, targetMenuId } = config.globalGoto;
            const target = this.getMenu(targetMenuId);
            if (!target) {
                throw new Error(`Target menu ${targetMenuId} not found for global goto`);
            }
            // provider che può restituire null (per es. se siamo già nel menu target)
            (Menu as any).globalActionProviders.push((menu: Menu) => {
                if (menu.id === targetMenuId) return null;
                return new GotoAction(label, target);
            });
        }
    }
}
