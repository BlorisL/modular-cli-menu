import { ColorName } from "chalk";
import { Action, ActionFunction, ActionFunctionJson, ActionGoto, ActionGotoJson } from "./actions";
import { Menu, MenuChoice, MenuChoiceJson, MenuInput, MenuInputJson } from "./menus";
import { PluginJson } from "./plugins";
import { TranslationJson, Translations } from "./translations";
import { Utility } from "./utility";

class Cli {
    protected menus: Record<string, Menu>;
    protected actions: Record<string, Action>;
    protected translations: TranslationJson;

    constructor() {
        this.menus = {};
        this.actions = {};
        this.translations = {};
    }

    public static write(text: string, color?: ColorName): void {
        console.log(Utility.write(text, color));
    }

    public addPlugin(plugin: PluginJson): this {
        if(plugin.translations) {
            Translations.addTranslations(plugin.translations);
        }

        plugin.menus?.forEach(menu => this.addMenu(menu, plugin.name));
        plugin.actions?.forEach(action => this.addAction(action, plugin.name));

        return this;
    }

    public getMenus(): Cli['menus'][string][] { return Object.values(this.menus); }
    public getMenu(name: string): Cli['menus'][string] | undefined { return this.menus[name]; }
    public addMenu(
        menu: Exclude<PluginJson['menus'], undefined>[number] | Cli['menus'][string],
        plugin?: string
    ): this {
    let menuInstance: Menu | undefined = undefined;
    if(menu instanceof Menu) {
        menuInstance = menu;
    } else {
        switch(menu.type) {
            case 'choice':
                menuInstance = new MenuChoice(menu as MenuChoiceJson);
                break;
            case 'input':
                menuInstance = new MenuInput(menu as MenuInputJson);
                break;
        }
    }
    if(menuInstance) {
        menuInstance.setPlugin(plugin ?? menuInstance.getPlugin() ?? 'default');
        this.menus[menuInstance.getName()] = menuInstance;
    }
        return this.load();
    }

    public getActions(): Cli['actions'][string][] { return Object.values(this.actions); }
    public getAction(name: string): Cli['actions'][string] | undefined { 
        return this.actions[name]; 
    }
    public addAction(
        action: Exclude<PluginJson['actions'], undefined>[number] | Cli['actions'][string],
        plugin?: string
    ): this {
        let actionInstance: Action | undefined = undefined;
        if(action instanceof Action) {
            actionInstance = action;
        } else {
            switch(action.type) {
                case 'function':
                    actionInstance = new ActionFunction(action as ActionFunctionJson);
                    break;
                case 'goto':
                    actionInstance = new ActionGoto(action as ActionGotoJson);
                    break;
            }
        }
        if(actionInstance) {
            actionInstance.setPlugin(plugin ?? actionInstance.getPlugin() ?? 'default');
            this.actions[actionInstance.getName()] = actionInstance;
        }

        return this.load();
    }
    public delAction(name: string): this {
        delete this.actions[name];
        return this;
    }

    protected getGlobalItems(): Array<Menu | Action> {
        const items: Array<Menu | Action> = [];

        this.getMenus().forEach(menu => {
            if(menu.isGlobal()) {
                items.push(menu);
            }
        });

        this.getActions().forEach(action => {
            if(action.isGlobal() && !action.getName().startsWith('back_')) {
                items.push(action);
            }
        });

        return items;
    }
    
    protected getActionTypeBack(menu: MenuChoice): ActionGoto | undefined {
        const item = menu.getValues().find(v => v.getValue().startsWith('back_'));
        const action = item?.getItem();
        if(action instanceof ActionGoto) return action;
        return this.getAction(item?.getValue() || '') as ActionGoto | undefined;
    }
    protected hasBackInParents(back: ActionGoto, menu: MenuChoice): boolean {
        return menu.getParents().includes(back.getTo());
    }

    public getSelectedLanguage(): string {
        return (this.getMenu('language') as MenuChoice).getSelectedValues()[0];
    }

    public trigger(menu: Menu, type: 'back' | 'exit' | string) {
        switch(type) {
            case 'back': {
                if(menu instanceof MenuChoice) {
                    const back = this.getActionTypeBack(menu);
                    if(back) {
                        const targetName = back.getTo();
                        const targetMenu = this.getMenu(targetName) as MenuChoice | undefined;
                        const targetParent = targetMenu ? this.getActionTypeBack(targetMenu)?.getTo() : undefined;
                        return this.run(targetName, targetParent);
                    }
                } else {
                    // MenuInput (and other non-choice menus) have no back_ action:
                    // fall back to the first declared parent, defaulting to 'main'.
                    const targetName = menu.getParents()[0] ?? 'main';
                    const targetMenu = this.getMenu(targetName) as MenuChoice | undefined;
                    const targetParent = targetMenu ? this.getActionTypeBack(targetMenu)?.getTo() : undefined;
                    return this.run(targetName, targetParent);
                }
                break;
            }
            case 'exit': return this.getAction('exit')?.run(); break;
        }
    }

    public load(): this {
        this.getMenus().forEach(menu => {
            menu.getParents().forEach(parentName => {
                const parentMenu = this.getMenu(parentName);
                if(parentMenu && parentMenu instanceof MenuChoice) {
                    if(!parentMenu.getValue(menu.getName())) {
                        parentMenu.addValue(menu);
                    }
                }
            });
        });

        this.getActions().forEach(action => {
            action.getParents().forEach(parentName => {
                const parentMenu = this.getMenu(parentName);
                if(parentMenu && parentMenu instanceof MenuChoice) {
                    if(!parentMenu.getValue(action.getName())) {
                        parentMenu.addValue(action);
                    }
                }
            });
        });

        return this;
    }

    public async run(
        value: string | Menu | Action = 'main',
        parent?: string | Menu | Action
    ): Promise<this> {
        if(typeof parent === 'string') {
            parent = this.getMenu(parent) || this.getAction(parent);
        }
        const item = typeof value === 'string' 
            ? (
                this.getMenu(value) || 
                this.getAction(value) ||
                // back_ actions are no longer stored globally; look them up in the parent menu's values
                (value.startsWith('back_') && parent instanceof MenuChoice
                    ? parent.getValue(value)?.getItem() as ActionGoto | undefined
                    : undefined)
            )
            : value
        ;
        
        if(item instanceof MenuChoice) {
            const parentName = parent 
                ? (typeof parent === 'string' ? parent : parent.getName()) 
                : undefined
            ;


            this.getGlobalItems().forEach(globalItem => {
                if(globalItem.getName() != item.getName()) {
                    if(globalItem.getName() == 'back') {
                        if(item.getName() !== 'main') {
                            const backTemplate = this.getAction('back') as ActionGoto;
                            if(backTemplate) {
                                const backName = `back_${item.getName()}`;
                                const existing = this.getActionTypeBack(item);
                                if(existing) {
                                    // Just update the destination in-place
                                    existing.setTo(parentName ?? 'main');
                                } else {
                                    const backAction = new ActionGoto(backTemplate.toJson())
                                        .setName(backName)
                                        .setTo(parentName ?? 'main');
                                    item.addValue(backAction);
                                }
                            }
                        }
                    } else if(globalItem.getName() == 'exit') {
                        const exitAction = this.getAction('exit');
                        if(exitAction) {
                            item.addValue(exitAction);
                        }
                    } else {
                        // Other global items (menus/actions): add if missing
                        if(!item.getValue(globalItem.getName())) {
                            item.addValue(globalItem);
                        }
                    }
                }
            });

            (await item.run()).forEach(async answer => 
                await this.run(
                    answer, 
                    item
                )
            );
        } else if(item instanceof MenuInput) {
            await item.run();
        } else if(item instanceof ActionFunction) {
            await item.run();
        } else if(item instanceof ActionGoto) {
            const targetName = item.getTo();
            const targetMenu = this.getMenu(targetName) as MenuChoice | undefined;
            const targetParent = targetMenu ? this.getActionTypeBack(targetMenu)?.getTo() : undefined;
            return await this.run(targetName, targetParent);
        } else if(typeof value === 'string' &&parent instanceof MenuChoice) {
            await parent.getConfigs()?.getDefaults()?.getCallback()?.({ 
                menu: parent,
                language: this.getSelectedLanguage(),
                values: [value], 
            });
        }

        return this;
    }

    public toJson() {
        return {
            menus: this.getMenus().map(m => m.toJson() as Exclude<PluginJson['menus'], undefined>[number]),
            actions: this.getActions().map(a => a.toJson() as Exclude<PluginJson['actions'], undefined>[number])
        };
    }
}

export { Cli };