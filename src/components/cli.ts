import { ColorName } from "chalk";
import { Action, ActionFunction, ActionFunctionJson, ActionGoto, ActionGotoJson } from "./actions";
import { Menu, MenuField, MenuFieldJson, MenuFieldOption } from "./menus";
import { MenuChoice, MenuChoiceJson } from "./menus/choice";
import { MenuInput, MenuInputJson } from "./menus/input";
import { Choice, Separator } from "@/prompts/Prompt";
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

    /**
     * Builds a Choice for a global item (back, exit, language, etc.)
     * applying env defaults as fallback for hover/selected, with idle fallback for color/underline/italic.
     */
    protected buildGlobalChoice(value: string, label: string, item: Menu | Action): Choice {
        const idle = item.getIdle();
        const hover = item.getHover();
        const sel = item.getSelected();

        const idleColor = idle?.getColor();
        const idleUnderline = idle?.isUnderline();
        const idleItalic = idle?.isItalic();

        return {
            value,
            label,
            multi: false,
            idle: {
                prefix: " ",
                color: idleColor,
                underline: idleUnderline,
                italic: idleItalic,
            },
            hover: {
                prefix: hover?.getPrefix() ?? Utility.getDefaultHoverPrefix(),
                color: hover?.getColor() ?? Utility.getDefaultHoverColor() ?? idleColor,
                underline: hover?.isUnderline() ?? Utility.getDefaultHoverUnderline() ?? idleUnderline,
                italic: hover?.isItalic() ?? idleItalic,
            },
            selected: {
                prefix: sel?.getPrefix() ?? Utility.getDefaultSelectedPrefix(),
                color: sel?.getColor() ?? Utility.getDefaultSelectedColor() ?? idleColor,
                underline: sel?.isUnderline() ?? Utility.getDefaultSelectedUnderline() ?? idleUnderline,
                italic: sel?.isItalic() ?? idleItalic,
            },
        };
    }

    protected getGlobalItems(): Array<Menu | Action> {
        const items: Array<Menu | Action> = [];

        this.getMenus().forEach((menu) => {
            if (menu.isGlobal()) items.push(menu);
        });

        this.getActions().forEach((action) => {
            if (action.isGlobal() && !action.getName().startsWith("back_")) items.push(action);
        });

        return items;
    }

    protected getActionTypeBack(menu: MenuField): ActionGoto | undefined {
        const item = menu.getOptions().find((v) => v.getValue().startsWith("back_"));
        const action = item?.getItem();
        if (action instanceof ActionGoto) return action;
        return this.getAction(item?.getValue() || "") as ActionGoto | undefined;
    }

    // Run handlers

    protected async runMenuInput(item: MenuInput, parentName?: string): Promise<void> {
        await this.runMenuField(item, parentName);
    }

    protected async runMenuChoices(item: MenuChoice, parentName?: string): Promise<void> {
        await this.runMenuField(item, parentName);
    }

    protected async runMenuField(item: MenuField, parentName?: string): Promise<void> {
        // Input setup: build sidebar global choices
        if (item.hasInput()) {
            const globalChoices: (Choice | Separator)[] = [];
            const backTemplate = this.getAction("back") as ActionGoto | undefined;
            if (backTemplate) {
                const backAction = new ActionGoto(backTemplate.toJson())
                    .setName("back_input")
                    .setTo(parentName ?? "main");
                const label = new MenuFieldOption(
                    backAction,
                    backAction.getName(),
                    false,
                    backAction.getIdle()?.toJson()
                ).getTranslationLabel(false, false);
                globalChoices.push(new Separator());
                globalChoices.push(this.buildGlobalChoice(backAction.getTo(), label, backAction));
            }
            this.getGlobalItems()
                .filter((g) => g.getName() !== "back")
                .forEach((globalItem) => {
                    const label = new MenuFieldOption(
                        globalItem,
                        globalItem.getName(),
                        false,
                        globalItem.getIdle()?.toJson()
                    ).getTranslationLabel(false, false);
                    globalChoices.push(this.buildGlobalChoice(globalItem.getName(), label, globalItem));
                });
            item.setGlobalChoices(item.getConfigs().getInputConfigs()?.isFastSubmit() ? [] : globalChoices);
        }

        // Choice setup: inject global items into menu values
        if (item.hasChoices()) {
            this.getGlobalItems().forEach((globalItem) => {
                if (globalItem.getName() === item.getName()) return;

                if (globalItem.getName() === "back") {
                    if (item.getName() === "main") return;
                    const backTemplate = this.getAction("back") as ActionGoto;
                    if (!backTemplate) return;

                    const backName = `back_${item.getName()}`;
                    const existing = this.getActionTypeBack(item);
                    if (existing) {
                        const isParentGlobal = parentName
                            ? this.getMenu(parentName)?.isGlobal() || this.getAction(parentName)?.isGlobal()
                            : false;
                        if (parentName !== undefined && !isParentGlobal) {
                            existing.setTo(parentName);
                        }
                    } else {
                        item.addOption(
                            new ActionGoto(backTemplate.toJson())
                                .setName(backName)
                                .setTo(parentName ?? "main")
                        );
                    }
                } else if (globalItem.getName() === "exit") {
                    const exitAction = this.getAction("exit");
                    if (exitAction) item.addOption(exitAction);
                } else {
                    if (!item.getOption(globalItem.getName())) item.addOption(globalItem);
                }
            });
        }

        // Run the field (prompt handles both input + choices together)
        const runResult = await item.run();

        // Input result (string)
        if (!Array.isArray(runResult)) {
            const inputResult = runResult;

            const globalAction = this.getGlobalItems().find((g) => g.getName() === inputResult);
            if (globalAction) {
                await this.run(globalAction, item);
                return;
            }

            const isBackNavigation =
                inputResult !== item.getInputValue() &&
                this.getMenu(inputResult) !== undefined;
            if (isBackNavigation) {
                const targetMenu = this.getMenu(inputResult);
                const targetParent = targetMenu instanceof MenuField
                    ? this.getActionTypeBack(targetMenu)?.getTo()
                    : undefined;
                await this.run(inputResult, targetParent);
                return;
            }

            await item.getConfigs().getInputConfigs()?.getCallback()?.({
                menu: item,
                value: item.getInputValue(),
                language: Translations.getSelectedLanguage(),
                parent: parentName,
            });
            return;
        }

        // Choice result (string[])
        const answers = runResult;

        for (const answer of answers) {
            if (answer.startsWith("back_")) {
                const backAction = item.getOption(answer)?.getItem();
                if (backAction instanceof ActionGoto) {
                    await this.run(backAction, item);
                    return;
                }
            }
            const globalAction = this.getGlobalItems().find((g) => g.getName() === answer);
            if (globalAction) {
                await this.run(globalAction, item);
                return;
            }
        }

        const choiceCallback = item.getConfigs().getChoiceConfigs()?.getCallback();
        if (choiceCallback) {
            await choiceCallback({
                menu: item,
                language: Translations.getSelectedLanguage(),
                values: item.getSelectedValues(),
                parent: parentName,
            });
        } else {
            for (const answer of answers) {
                await this.run(answer, item);
            }
        }
    }

    protected async runActionGoto(item: ActionGoto, parentName?: string): Promise<void> {
        const targetName = item.getTo();
        const targetMenu = this.getMenu(targetName);
        const isBackAction = item.getName().startsWith("back_");
        const targetParent = isBackAction
            ? targetMenu instanceof MenuField
                ? this.getActionTypeBack(targetMenu)?.getTo()
                : undefined
            : parentName;

        await this.run(targetName, targetParent);
    }

    public addPlugin(plugin: PluginJson): this {
        if (plugin.translations) {
            Translations.addTranslations(plugin.translations);
        }

        plugin.menus?.forEach((menu) => this.addMenu(menu, plugin.name));
        plugin.actions?.forEach((action) => this.addAction(action, plugin.name));

        return this;
    }

    public getMenus(): Cli["menus"][string][] { return Object.values(this.menus); }
    public getMenu(name: string): Cli["menus"][string] | undefined { return this.menus[name]; }
    public addMenu(
        menu: Exclude<PluginJson["menus"], undefined>[number] | Cli["menus"][string],
        plugin?: string
    ): this {
        const menuName = menu instanceof Menu ? menu.getName() : menu.name;
        if (menuName !== "language" || Translations.isEnabled()) {
            let menuInstance: Menu | undefined = undefined;
            if (menu instanceof Menu) {
                menuInstance = menu;
            } else {
                if (menu.type === "field") {
                    menuInstance = new MenuField(menu as MenuFieldJson);
                } else if (menu.type === "choice") {
                    menuInstance = new MenuChoice(menu as MenuChoiceJson);
                } else if (menu.type === "input") {
                    menuInstance = new MenuInput(menu as MenuInputJson);
                }
            }
            if (menuInstance) {
                menuInstance.setPlugin(plugin ?? menuInstance.getPlugin() ?? "default");
                if (menuInstance.isGlobal() && menuInstance.getIndex() === undefined) {
                    const reservedIndexes: Record<string, number> = { language: -2 };
                    const reserved = reservedIndexes[menuInstance.getName()];
                    if (reserved !== undefined) menuInstance.setIndex(reserved);
                }
                this.menus[menuInstance.getName()] = menuInstance;
            }
        }

        return this.load();
    }

    public getActions(): Cli["actions"][string][] { return Object.values(this.actions); }
    public getAction(name: string): Cli["actions"][string] | undefined { return this.actions[name]; }
    public addAction(
        action: Exclude<PluginJson["actions"], undefined>[number] | Cli["actions"][string],
        plugin?: string
    ): this {
        let actionInstance: Action | undefined = undefined;
        if (action instanceof Action) {
            actionInstance = action;
        } else {
            switch (action.type) {
                case "function":
                    actionInstance = new ActionFunction(action as ActionFunctionJson);
                    break;
                case "goto":
                    actionInstance = new ActionGoto(action as ActionGotoJson);
                    break;
            }
        }

        if (actionInstance) {
            actionInstance.setPlugin(plugin ?? actionInstance.getPlugin() ?? "default");
            if (actionInstance.isGlobal() && actionInstance.getIndex() === undefined) {
                const reservedIndexes: Record<string, number> = { back: -1, exit: -3 };
                const reserved = reservedIndexes[actionInstance.getName()];
                if (reserved !== undefined) actionInstance.setIndex(reserved);
            }
            this.actions[actionInstance.getName()] = actionInstance;
        }

        return this.load();
    }
    public delAction(name: string): this { delete this.actions[name]; return this; }

    public trigger(menu: Menu, type: "back" | "exit" | string, parent?: string): Promise<unknown> | void {
        switch (type) {
            case "back": {
                if (menu instanceof MenuField) {
                    const back = this.getActionTypeBack(menu);
                    if (back) {
                        const targetMenu = this.getMenu(back.getTo());
                        const targetParent = targetMenu instanceof MenuField
                            ? this.getActionTypeBack(targetMenu)?.getTo()
                            : undefined;
                        return this.run(back.getTo(), targetParent);
                    }
                } else {
                    const targetName = parent ?? "main";
                    const targetMenu = this.getMenu(targetName);
                    const targetParent = targetMenu instanceof MenuField
                        ? this.getActionTypeBack(targetMenu)?.getTo()
                        : undefined;
                    return this.run(targetName, targetParent);
                }
                break;
            }
            case "exit":
                return this.getAction("exit")?.run();
        }
    }

    public load(): this {
        this.getMenus().forEach((menu) => {
            menu.getParents().forEach((parentName) => {
                const parentMenu = this.getMenu(parentName);
                if (parentMenu instanceof MenuField) {
                    if (!parentMenu.getOption(menu.getName())) parentMenu.addOption(menu);
                }
            });
        });
        this.getActions().forEach((action) => {
            action.getParents().forEach((parentName) => {
                const parentMenu = this.getMenu(parentName);
                if (parentMenu instanceof MenuField) {
                    if (!parentMenu.getOption(action.getName())) parentMenu.addOption(action);
                }
            });
        });
        return this;
    }

    // Main dispatcher

    public async run(
        value: string | Menu | Action = "main",
        parent?: string | Menu | Action
    ): Promise<this> {
        if (typeof parent === "string") {
            parent = this.getMenu(parent) || this.getAction(parent);
        }
        const parentName = parent
            ? typeof parent === "string"
                ? parent
                : parent.getName()
            : undefined;

        const item =
            typeof value === "string"
                ? this.getMenu(value) ||
                  this.getAction(value) ||
                  (value.startsWith("back_") && parent instanceof MenuField
                      ? (parent.getOption(value)?.getItem() as ActionGoto | undefined)
                      : undefined)
                : value;

        if (item instanceof MenuInput) {
            await this.runMenuInput(item, parentName);
        } else if (item instanceof MenuChoice) {
            await this.runMenuChoices(item, parentName);
        } else if (item instanceof MenuField) {
            await this.runMenuField(item, parentName);
        } else if (item instanceof ActionFunction) {
            await item.run();
        } else if (item instanceof ActionGoto) {
            await this.runActionGoto(item, parentName);
        }

        return this;
    }

    public toJson(): Omit<PluginJson, "name" | "version" | "translations"> {
        return {
            menus: this.getMenus().map(
                (m) => m.toJson() as Exclude<PluginJson["menus"], undefined>[number]
            ),
            actions: this.getActions().map(
                (a) => a.toJson() as Exclude<PluginJson["actions"], undefined>[number]
            ),
        };
    }
}

export { Cli };