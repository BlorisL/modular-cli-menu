import { ColorName } from "chalk";
import { Action, ActionFunction, ActionFunctionJson, ActionGoto, ActionGotoJson } from "./actions";
import { Menu, MenuChoice, MenuChoiceJson, MenuChoiceOption, MenuInput, MenuInputJson } from "./menus";
import { Choice, Separator } from "@/prompts/Choices";
import { PluginJson } from "./plugins";
import { Translations } from "./translations";
import { Utility } from "./utility";

class Cli {
    protected menus: Record<string, Menu>;
    protected actions: Record<string, Action>;

    constructor() {
        this.menus = {};
        this.actions = {};
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
        const menuName = menu instanceof Menu ? menu.getName() : menu.name;
        if(menuName !== 'language' || Translations.isEnabled()) {
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
                if(menuInstance.isGlobal() && menuInstance.getIndex() === undefined) {
                    const reservedIndexes: Record<string, number> = { language: -2 };
                    const reserved = reservedIndexes[menuInstance.getName()];
                    if(reserved !== undefined) menuInstance.setIndex(reserved);
                }
                this.menus[menuInstance.getName()] = menuInstance;
            }
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
            if(actionInstance.isGlobal() && actionInstance.getIndex() === undefined) {
                const reservedIndexes: Record<string, number> = { back: -1, exit: -3 };
                const reserved = reservedIndexes[actionInstance.getName()];
                if(reserved !== undefined) actionInstance.setIndex(reserved);
            }
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
            if(menu.isGlobal()) items.push(menu);
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

    public trigger(menu: Menu, type: 'back' | 'exit' | string, parent?: string) {
        switch(type) {
            case 'back': {
                if(menu instanceof MenuChoice) {
                    const back = this.getActionTypeBack(menu);
                    if(back) {
                        const targetMenu = this.getMenu(back.getTo());
                        const targetParent = targetMenu instanceof MenuChoice
                            ? this.getActionTypeBack(targetMenu)?.getTo()
                            : undefined;
                        return this.run(back.getTo(), targetParent);
                    }
                } else {
                    const targetName = parent ?? 'main';
                    const targetMenu = this.getMenu(targetName);
                    const targetParent = targetMenu instanceof MenuChoice
                        ? this.getActionTypeBack(targetMenu)?.getTo()
                        : undefined;
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
                if(parentMenu instanceof MenuChoice) {
                    if(!parentMenu.getValue(menu.getName())) {
                        parentMenu.addValue(menu);
                    }
                }
            });
        });

        this.getActions().forEach(action => {
            action.getParents().forEach(parentName => {
                const parentMenu = this.getMenu(parentName);
                if(parentMenu instanceof MenuChoice) {
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
        const parentName = parent
            ? (typeof parent === 'string' ? parent : parent.getName())
            : undefined;

        const item = typeof value === 'string'
            ? (
                this.getMenu(value) ||
                this.getAction(value) ||
                (value.startsWith('back_') && parent instanceof MenuChoice
                    ? parent.getValue(value)?.getItem() as ActionGoto | undefined
                    : undefined)
            )
            : value;

        if(item instanceof MenuChoice) {
            this.getGlobalItems().forEach(globalItem => {
                if(globalItem.getName() === item.getName()) return;

                if(globalItem.getName() === 'back') {
                    if(item.getName() === 'main') return;
                    const backTemplate = this.getAction('back') as ActionGoto;
                    if(!backTemplate) return;
                    const backName = `back_${item.getName()}`;
                    const existing = this.getActionTypeBack(item);
                    if(existing) {
                        const isParentGlobal = parentName
                            ? (this.getMenu(parentName)?.isGlobal() || this.getAction(parentName)?.isGlobal())
                            : false;
                        if(parentName !== undefined && !isParentGlobal) {
                            existing.setTo(parentName);
                        }
                    } else {
                        item.addValue(
                            new ActionGoto(backTemplate.toJson())
                                .setName(backName)
                                .setTo(parentName ?? 'main')
                        );
                    }
                } else if(globalItem.getName() === 'exit') {
                    const exitAction = this.getAction('exit');
                    if(exitAction) item.addValue(exitAction);
                } else {
                    if(!item.getValue(globalItem.getName())) item.addValue(globalItem);
                }
            });

            const answers = await item.run();
            for(const answer of answers) {
                await this.run(answer, item);
            }

            await item.getConfigs()?.getDefaults()?.getCallback()?.({
                menu: item,
                language: Translations.getSelectedLanguage(),
                values: item.getSelectedValues(),
                parent: parentName,
            });
        } else if(item instanceof MenuInput) {
            // Persist parent so re-opens without explicit parent still work correctly
            if(parentName !== undefined) item.setLastParent(parentName);
            const effectiveParent = parentName ?? item.getLastParent();

            const globalChoices: (Choice | Separator)[] = [];
            const backTemplate = this.getAction('back') as ActionGoto | undefined;
            if(backTemplate) {
                const backAction = new ActionGoto(backTemplate.toJson())
                    .setName('back_input')
                    .setTo(effectiveParent ?? 'main');
                const label = new MenuChoiceOption(
                    backAction, backAction.getName(), false, backAction.getColor(),
                ).getTranslationLabel(false);
                globalChoices.push(new Separator());
                globalChoices.push({ value: backAction.getTo(), label, multi: false });
            }
            this.getGlobalItems()
                .filter(g => g.getName() !== 'back')
                .forEach(globalItem => {
                    const label = new MenuChoiceOption(
                        globalItem, globalItem.getName(), false, globalItem.getColor(),
                    ).getTranslationLabel(false);
                    globalChoices.push({ value: globalItem.getName(), label, multi: false });
                });
            item.setGlobalChoices(globalChoices);
            const inputResult = await item.run();

            // Global action selected (language, exit, …)
            const globalAction = this.getGlobalItems().find(g => g.getName() === inputResult);
            if(globalAction) {
                await this.run(globalAction, item);
                return this;
            }

            // Back navigation: result is a known menu name the user did NOT type
            const isBackNavigation = inputResult !== item.getValue()
                && this.getMenu(inputResult) !== undefined;
            if(isBackNavigation) {
                const targetMenu = this.getMenu(inputResult);
                const targetParent = targetMenu instanceof MenuChoice
                    ? this.getActionTypeBack(targetMenu)?.getTo()
                    : undefined;
                await this.run(inputResult, targetParent);
                return this;
            }

            // Normal submit — run the callback
            await item.getCallback()?.({
                menu: item,
                value: item.getValue(),
                language: Translations.getSelectedLanguage(),
                parent: effectiveParent,
            });
        } else if(item instanceof ActionFunction) {
            await item.run();
        } else if(item instanceof ActionGoto) {
            const targetName = item.getTo();
            const targetMenu = this.getMenu(targetName);
            const isBackAction = item.getName().startsWith('back_');
            const targetParent = isBackAction
                ? (targetMenu instanceof MenuChoice ? this.getActionTypeBack(targetMenu)?.getTo() : undefined)
                : parentName;
            await this.run(targetName, targetParent);
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