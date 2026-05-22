import { ColorName } from "chalk";
import { Action, ActionFunction, ActionFunctionJson, ActionGoto, ActionGotoJson } from "@/components/actions";
import { Menu, MenuField, MenuFieldJson } from "@/components/menus";
import { MenuChoice, MenuChoiceJson } from "@/components/menus/choice";
import { MenuInput, MenuInputJson } from "@/components/menus/input";
import { MenuEditor, MenuEditorJson } from "@/components/menus/editor";
import { Choice, Separator } from "@/prompts/Prompt";
import { PluginJson } from "@/components/plugins";
import { Translations } from "@/components/translations";
import { Utility } from "@/components/utility";

class Cli {
    protected menus: Record<string, Menu>;
    protected actions: Record<string, Action>;

    /**
     * Creates a new Cli instance with empty menus and actions registries.
     * Use `addMenu()`, `addAction()`, and `run()` to build and execute the CLI.
     */
    constructor() {
        this.menus = {};
        this.actions = {};
    }

    /**
     * Writes a styled text line to stdout.
     *
     * @param text Text to print.
     * @param color Optional chalk color name.
     */
    /**
     * Writes text to stdout with optional chalk color styling.
     * @param text Text to write.
     * @param color Optional chalk color name.
     */
    public static write(text: string, color?: ColorName): void {
        console.log(Utility.write(text, color));
    }

    /**
     * Builds a Choice for a global item (back, exit, language, etc.)
     * applying env defaults as fallback for hover/selected, with idle fallback for color/underline/italic.
     */
    /**
     * Builds a global choice entry for a Menu or Action.
     * @param value Choice value/name.
     * @param label Display label.
     * @param item Menu or Action instance.
     */
    protected buildGlobalChoice(value: string, label: string, item: Menu | Action): Choice {
        const idle = item.getStyles().getIdle();
        const hover = item.getStyles().getHover();
        const sel = item.getStyles().getSelected();

        const idlePrefix = idle?.getPrefix() ?? Utility.getEnv().getIdlePrefix();
        const idleColor = idle?.getColor() ?? Utility.getEnv().getIdleColor();
        const idleUnderline = idle?.isUnderline() ?? Utility.getEnv().getIdleUnderline();
        const idleItalic = idle?.isItalic();

        return {
            value,
            label,
            multi: false,
            idle: {
                prefix: idlePrefix,
                color: idleColor,
                underline: idleUnderline,
                italic: idleItalic,
            },
            hover: {
                prefix: hover?.getPrefix() ?? Utility.getEnv().getHoverPrefix(),
                color: hover?.getColor() ?? Utility.getEnv().getHoverColor() ?? idleColor,
                underline: hover?.isUnderline() ?? Utility.getEnv().getHoverUnderline() ?? idleUnderline,
                italic: hover?.isItalic() ?? idleItalic,
            },
            selected: {
                prefix: sel?.getPrefix() ?? Utility.getEnv().getSelectedPrefix(),
                color: sel?.getColor() ?? Utility.getEnv().getSelectedColor() ?? idleColor,
                underline: sel?.isUnderline() ?? Utility.getEnv().getSelectedUnderline() ?? idleUnderline,
                italic: sel?.isItalic() ?? idleItalic,
            },
        };
    }

    /**
     * Returns true if `menuName` equals `ancestorName` or has it in its `parents` chain.
     */
    protected menuBelongsToAncestor(menuName: string | undefined, ancestorName: string): boolean {
        let belongs = false;
        if (menuName !== undefined) {
            const stack: string[] = [menuName];
            const visited = new Set<string>();

            while (!belongs && stack.length > 0) {
                const current = stack.pop() as string;
                if (current === ancestorName) {
                    belongs = true;
                } else if (!visited.has(current)) {
                    visited.add(current);
                    const currentMenu = this.getMenu(current);
                    currentMenu?.getParents().forEach((parentName) => {
                        if (!visited.has(parentName)) {
                            stack.push(parentName);
                        }
                    });
                }
            }
        }
        return belongs;
    }

    /**
     * Returns true when a global item can be shown in `currentMenuName`.
     */
    protected isVisibleGlobalItem(globalItem: Menu | Action, currentMenuName?: string): boolean {
        let visible = true;
        if (currentMenuName !== undefined && globalItem instanceof ActionGoto) {
            const targetMenu = this.getMenu(globalItem.getTo());
            if (targetMenu?.isAnchorGlobal()) {
                visible = !this.menuBelongsToAncestor(currentMenuName, targetMenu.getName());
            }
        }
        return visible;
    }

    /**
     * Collects all global menus and actions to be added as choices in every menu.
     */
    protected getGlobalItems(currentMenuName?: string): Array<Menu | Action> {
        const items: Array<Menu | Action> = [];

        this.getMenus().forEach((menu) => {
            if (menu.isGlobal()) {
                items.push(menu);
            }
        });

        this.getActions().forEach((action) => {
            if (action.isGlobal() && !action.getName().startsWith("back_")) {
                items.push(action);
            }
        });

        const result = currentMenuName === undefined
            ? items
            : items.filter((item) => this.isVisibleGlobalItem(item, currentMenuName))
        ;
        return result;
    }

    /**
     * Creates a "back" action for the given menu, or returns undefined if none should be shown.
     * @param menu MenuField or MenuChoice to navigate back from.
     */
    protected getActionTypeBack(menu: MenuField | MenuChoice): ActionGoto | undefined {
        const item = menu.getOptions().find((v) => v.getValue().startsWith("back_"));
        const action = item?.getItem();
        let result: ActionGoto | undefined;
        if (action instanceof ActionGoto) {
            result = action;
        } else {
            result = this.getAction(item?.getValue() || "") as ActionGoto | undefined;
        }
        return result;
    }

    /**
     * Resolves the parent menu name, prioritizing runtime parameter over Menu parent list.
     * @param menu The current menu context.
     * @param runtimeParent Runtime-provided parent name override.
     */
    protected resolveTargetParent(menu: Menu | undefined, runtimeParent?: string): string | undefined {
        let targetParent: string | undefined;

        if (menu) {
            if (runtimeParent && menu.getParents().includes(runtimeParent)) {
                targetParent = runtimeParent;
            } else if (menu instanceof MenuField || menu instanceof MenuChoice) {
                const dynamic = this.getActionTypeBack(menu)?.getTo();
                if (dynamic) {
                    targetParent = dynamic;
                } else {
                    const declaredParents = menu.getParents();
                    if (declaredParents.length === 1) {
                        targetParent = declaredParents[0];
                    }
                }
            } else {
                const declaredParents = menu.getParents();
                if (declaredParents.length === 1) {
                    targetParent = declaredParents[0];
                }
            }
        }

        return targetParent;
    }

    // Run handlers

    /**
     * Executes an input menu interaction and handles its callback.
     * @param item MenuInput to run.
     * @param parentName Optional parent menu name for navigation context.
     */
    protected async runMenuInput(item: MenuInput, parentName?: string): Promise<void> {
        // Build sidebar global choices
        const globalChoices: (Choice | Separator)[] = [];
        const visibleGlobalItems = this.getGlobalItems(item.getName());
        const resolvedParent = this.resolveTargetParent(item, parentName) ?? "main";
        const backTemplate = this.getAction("back") as ActionGoto | undefined;
        if (backTemplate) {
            const backAction = new ActionGoto(backTemplate.toJson()).setName("back_input").setTo(resolvedParent);
            const label = backAction.getLabels().getTitle()!.write(backAction.getStyles().getIdle()?.toJson());
            globalChoices.push(new Separator());
            globalChoices.push(this.buildGlobalChoice(backAction.getTo(), label, backAction));
        }
        visibleGlobalItems
            .filter((g) => g.getName() !== "back")
            .forEach((globalItem) => {
                const label = globalItem.getLabels().getTitle()!.write(globalItem.getStyles().getIdle()?.toJson());
                globalChoices.push(this.buildGlobalChoice(globalItem.getName(), label, globalItem));
            });
        item.setGlobalChoices(item.getConfigs().isFastSubmit() ? [] : globalChoices);

        const runResult = await item.run();

        // Input result (string)
        if (!Array.isArray(runResult)) {
            const inputResult = runResult;
            const globalAction = visibleGlobalItems.find((g) => g.getName() === inputResult);
            if (globalAction) {
                await this.run(globalAction, item);
            } else {
                const isBackNavigation = inputResult !== item.getValue() && this.getMenu(inputResult) !== undefined;
                if (isBackNavigation) {
                    const targetMenu = this.getMenu(inputResult);
                    const targetParent = this.resolveTargetParent(targetMenu, parentName);
                    await this.run(inputResult, targetParent);
                } else {
                    await item.getConfigs().getCallback()?.({
                        menu: item,
                        value: item.getValue(),
                        language: Translations.getSelectedLanguage(),
                        parent: parentName,
                    });
                }
            }
        } else {
            // Sidebar selection (string[])
            for (const answer of runResult) {
                const globalAction = visibleGlobalItems.find((g) => g.getName() === answer);
                if (globalAction) {
                    await this.run(globalAction, item);
                    break;
                }

                const targetMenu = this.getMenu(answer);
                if (targetMenu) {
                    const targetParent = this.resolveTargetParent(targetMenu, parentName);
                    await this.run(answer, targetParent);
                    break;
                }
            }
        }
    }

    /**
     * Executes an editor menu interaction (opens $EDITOR with pre-populated content).
     * @param item MenuEditor to run.
     * @param parentName Optional parent menu name for navigation context.
     */
    protected async runMenuEditor(item: MenuEditor, parentName?: string): Promise<void> {
        const value = await item.run(Translations.getSelectedLanguage());

        await item.getConfigs().getCallback()?.({
            menu: item,
            value,
            language: Translations.getSelectedLanguage(),
            parent: parentName,
        });
    }

    /**
     * Executes a choice menu interaction and handles selected items or callbacks.
     * @param item MenuChoice to run.
     * @param parentName Optional parent menu name for navigation context.
     */
    protected async runMenuChoices(item: MenuChoice, parentName?: string): Promise<void> {
        // Inject global items into choice list
        const visibleGlobalItems = this.getGlobalItems(item.getName());
        visibleGlobalItems.forEach((globalItem) => {
            if (globalItem.getName() !== item.getName()) {
                if (globalItem.getName() === "back") {
                    if (item.getName() !== "main") {
                        const backTemplate = this.getAction("back") as ActionGoto;
                        if (backTemplate) {
                            const backName = `back_${item.getName()}`;
                            const existing = this.getActionTypeBack(item);
                            if (existing) {
                                const isParentGlobal = parentName
                                    ? this.getMenu(parentName)?.isGlobal() || this.getAction(parentName)?.isGlobal()
                                    : false
                                ;
                                if (parentName !== undefined && !isParentGlobal) {
                                    existing.setTo(parentName);
                                }
                            } else {
                                item.addOption(
                                    new ActionGoto(backTemplate.toJson()).setName(backName).setTo(parentName ?? "main")
                                );
                            }
                        }
                    }
                } else if (globalItem.getName() === "exit") {
                    const exitAction = this.getAction("exit");
                    if (exitAction) {
                        item.addOption(exitAction);
                    }
                } else {
                    if (!item.getOption(globalItem.getName())) {
                        item.addOption(globalItem);
                    }
                }
            }
        });

        const answers = (await item.run()) as string[];

        let handled = false;
        for (const answer of answers) {
            if (answer.startsWith("back_")) {
                const backAction = item.getOption(answer)?.getItem();
                if (backAction instanceof ActionGoto) {
                    await this.run(backAction, item);
                    handled = true;
                    break;
                }
            }
            const globalAction = visibleGlobalItems.find((g) => g.getName() === answer);
            if (globalAction) {
                await this.run(globalAction, item);
                handled = true;
                break;
            }
        }

        if (!handled) {
            const choiceCallback = item.getConfigs().getCallback();
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
    }

    /**
     * Executes a field menu interaction (choice + optional input sequence).
     * @param item MenuField to run.
     * @param parentName Optional parent menu name for navigation context.
     */
    protected async runMenuField(item: MenuField, parentName?: string): Promise<void> {
        const visibleGlobalItems = this.getGlobalItems(item.getName());

        // Input sidebar setup
        if (item.hasInput()) {
            const inputCfg = item.getInput()!.getConfigs();
            const globalChoices: (Choice | Separator)[] = [];
            const resolvedParent = this.resolveTargetParent(item, parentName) ?? "main";
            const backTemplate = this.getAction("back") as ActionGoto | undefined;
            if (backTemplate) {
                const backAction = new ActionGoto(backTemplate.toJson()).setName("back_input").setTo(resolvedParent);
                const label = backAction.getLabels().getTitle()!.write(backAction.getStyles().getIdle()?.toJson());
                globalChoices.push(new Separator());
                globalChoices.push(this.buildGlobalChoice(backAction.getTo(), label, backAction));
            }
            visibleGlobalItems
                .filter((g) => g.getName() !== "back")
                .forEach((globalItem) => {
                    const label = globalItem.getLabels().getTitle()!.write(globalItem.getStyles().getIdle()?.toJson());
                    globalChoices.push(this.buildGlobalChoice(globalItem.getName(), label, globalItem));
                });
            item.setGlobalChoices(inputCfg.isFastSubmit() ? [] : globalChoices);
        }

        // Choice setup: inject global items
        if (item.hasChoices()) {
            visibleGlobalItems.forEach((globalItem) => {
                if (globalItem.getName() !== item.getName()) {
                    if (globalItem.getName() === "back") {
                        if (item.getName() !== "main") {
                            const backTemplate = this.getAction("back") as ActionGoto;
                            if (backTemplate) {
                                const backName = `back_${item.getName()}`;
                                const existing = this.getActionTypeBack(item);
                                if (existing) {
                                    const isParentGlobal = parentName
                                        ? this.getMenu(parentName)?.isGlobal() || this.getAction(parentName)?.isGlobal()
                                        : false
                                    ;
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
                            }
                        }
                    } else if (globalItem.getName() === "exit") {
                        const exitAction = this.getAction("exit");
                        if (exitAction) {
                            item.addOption(exitAction);
                        }
                    } else {
                        if (!item.getOption(globalItem.getName())) {
                            item.addOption(globalItem);
                        }
                    }
                }
            });
        }

        const runResult = await item.run();

        // Input result (string)
        if (!Array.isArray(runResult)) {
            const inputResult = runResult;
            const globalAction = visibleGlobalItems.find((g) => g.getName() === inputResult);
            if (globalAction) {
                await this.run(globalAction, item);
            } else {
                const isBackNavigation =
                    inputResult !== item.getInput()!.getValue() && this.getMenu(inputResult) !== undefined;
                if (isBackNavigation) {
                    const targetMenu = this.getMenu(inputResult);
                    const targetParent = this.resolveTargetParent(targetMenu, parentName);
                    await this.run(inputResult, targetParent);
                } else {
                    await item.getInput()?.getConfigs().getCallback()?.({
                        menu: item.getInput()!,
                        value: item.getInput()!.getValue(),
                        language: Translations.getSelectedLanguage(),
                        parent: parentName,
                    });
                }
            }
        } else {
            // Choice result (string[])
            const answers = runResult;
            let handled = false;
            for (const answer of answers) {
                if (answer.startsWith("back_")) {
                    const backAction = item.getOption(answer)?.getItem();
                    if (backAction instanceof ActionGoto) {
                        await this.run(backAction, item);
                        handled = true;
                        break;
                    }
                }
                const globalAction = visibleGlobalItems.find((g) => g.getName() === answer);
                if (globalAction) {
                    await this.run(globalAction, item);
                    handled = true;
                    break;
                }

                const targetMenu = this.getMenu(answer);
                if (targetMenu) {
                    const targetParent = this.resolveTargetParent(targetMenu, parentName);
                    await this.run(answer, targetParent);
                    handled = true;
                    break;
                }
            }

            if (!handled) {
                const choiceCallback = item.getChoice()?.getConfigs().getCallback();
                if (choiceCallback) {
                    await choiceCallback({
                        menu: item.getChoice()!,
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
        }
    }

    /**
     * Executes a goto action: records the target and returns control to the caller.
     * @param item ActionGoto to execute.
     * @param parentName Optional parent menu name for navigation context.
     */
    protected async runActionGoto(item: ActionGoto, parentName?: string): Promise<void> {
        const targetName = item.getTo();
        const targetMenu = this.getMenu(targetName);
        const isBackAction = item.getName().startsWith("back_");
        const targetParent = isBackAction ? this.resolveTargetParent(targetMenu, parentName) : parentName;

        await this.run(targetName, targetParent);
    }

    /**
     * Registers a plugin and merges its translations, menus and actions.
     *
     * @param plugin Plugin definition.
     * @returns Current Cli instance for chaining.
     */
    public addPlugin(plugin: PluginJson): this {
        if (plugin.translations) {
            Translations.addTranslations(plugin.translations);
        }

        plugin.menus?.forEach((menu) => this.addMenu(menu, plugin.name));
        plugin.actions?.forEach((action) => this.addAction(action, plugin.name));

        return this;
    }

    /**
     * Returns all registered menus.
     */
    public getMenus(): Cli["menus"][string][] {
        return Object.values(this.menus);
    }

    /**
     * Returns a menu by name.
     *
     * @param name Menu name.
     */
    public getMenu(name: string): Cli["menus"][string] | undefined {
        return this.menus[name];
    }

    /**
     * Adds a menu from JSON config.
     *
     * @param menu Menu JSON definition.
     * @param plugin Optional plugin namespace override.
     * @returns Current Cli instance for chaining.
     */
    public addMenu(menu: Exclude<PluginJson["menus"], undefined>[number], plugin?: string): this;

    /**
     * Adds an existing Menu instance.
     *
     * @param menu Menu instance.
     * @param plugin Optional plugin namespace override.
     * @returns Current Cli instance for chaining.
     */
    public addMenu(menu: Cli["menus"][string], plugin?: string): this;

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
                    menuInstance = new MenuField({ ...(menu as MenuFieldJson), plugin: plugin ?? menu.plugin });
                } else if (menu.type === "choice") {
                    menuInstance = new MenuChoice({ ...(menu as MenuChoiceJson), plugin: plugin ?? menu.plugin });
                } else if (menu.type === "input") {
                    menuInstance = new MenuInput({ ...(menu as MenuInputJson), plugin: plugin ?? menu.plugin });
                } else if (menu.type === "editor") {
                    menuInstance = new MenuEditor({ ...(menu as MenuEditorJson), plugin: plugin ?? menu.plugin });
                }
            }
            if (menuInstance) {
                menuInstance.setPlugin(plugin ?? menuInstance.getPlugin() ?? "default");
                if (menuInstance.isGlobal() && menuInstance.getIndex() === undefined) {
                    const reservedIndexes: Record<string, number> = { language: -2 };
                    const reserved = reservedIndexes[menuInstance.getName()];
                    if (reserved !== undefined) {
                        menuInstance.setIndex(reserved);
                    }
                }
                this.menus[menuInstance.getName()] = menuInstance;
            }
        }

        return this.load();
    }

    /**
     * Returns all registered actions.
     */
    public getActions(): Cli["actions"][string][] {
        return Object.values(this.actions);
    }

    /**
     * Returns an action by name.
     *
     * @param name Action name.
     */
    public getAction(name: string): Cli["actions"][string] | undefined {
        return this.actions[name];
    }

    /**
     * Adds an action from JSON config.
     *
     * @param action Action JSON definition.
     * @param plugin Optional plugin namespace override.
     * @returns Current Cli instance for chaining.
     */
    public addAction(action: Exclude<PluginJson["actions"], undefined>[number], plugin?: string): this;

    /**
     * Adds an existing Action instance.
     *
     * @param action Action instance.
     * @param plugin Optional plugin namespace override.
     * @returns Current Cli instance for chaining.
     */
    public addAction(action: Cli["actions"][string], plugin?: string): this;

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
                    actionInstance = new ActionFunction({
                        ...(action as ActionFunctionJson),
                        plugin: plugin ?? action.plugin,
                    });
                    break;
                case "goto":
                    actionInstance = new ActionGoto({ ...(action as ActionGotoJson), plugin: plugin ?? action.plugin });
                    break;
            }
        }

        if (actionInstance) {
            actionInstance.setPlugin(plugin ?? actionInstance.getPlugin() ?? "default");
            if (actionInstance.isGlobal() && actionInstance.getIndex() === undefined) {
                const reservedIndexes: Record<string, number> = { back: -1, exit: -3 };
                const reserved = reservedIndexes[actionInstance.getName()];
                if (reserved !== undefined) {
                    actionInstance.setIndex(reserved);
                }
            }
            this.actions[actionInstance.getName()] = actionInstance;
        }

        return this.load();
    }

    /**
     * Deletes an action by name.
     *
     * @param name Action name.
     * @returns Current Cli instance for chaining.
     */
    public delAction(name: string): this {
        delete this.actions[name];
        return this;
    }

    /**
     * Triggers a shortcut flow from a menu.
     *
     * Supported built-in shortcuts:
     * - "back": navigates to the computed parent.
     * - "exit": executes the global exit action.
     *
     * @param menu Current menu context.
     * @param type Trigger type.
     * @param parent Optional runtime parent override.
     */
    public trigger(menu: Menu, type: "back" | "exit" | string, parent?: string): Promise<unknown> | void {
        switch (type) {
            case "back": {
                if (menu instanceof MenuField) {
                    const back = this.getActionTypeBack(menu);
                    if (back) {
                        const targetMenu = this.getMenu(back.getTo());
                        const targetParent = targetMenu instanceof MenuField || targetMenu instanceof MenuChoice
                            ? this.getActionTypeBack(targetMenu)?.getTo()
                            : undefined
                        ;
                        return this.run(back.getTo(), targetParent);
                    }
                } else {
                    const targetName = parent ?? "main";
                    const targetMenu = this.getMenu(targetName);
                    const targetParent = targetMenu instanceof MenuField || targetMenu instanceof MenuChoice
                        ? this.getActionTypeBack(targetMenu)?.getTo()
                        : undefined
                    ;
                    return this.run(targetName, targetParent);
                }
                break;
            }
            case "exit":
                return this.getAction("exit")?.run();
        }
    }

    /**
     * Rebuilds reverse links by injecting menus/actions into their parent menus.
     *
     * @returns Current Cli instance for chaining.
     */
    public load(): this {
        this.getMenus().forEach((menu) => {
            menu.getParents().forEach((parentName) => {
                const parentMenu = this.getMenu(parentName);
                if (parentMenu instanceof MenuField || parentMenu instanceof MenuChoice) {
                    if (!parentMenu.getOption(menu.getName())) {
                        parentMenu.addOption(menu);
                    }
                }
            });
        });
        this.getActions().forEach((action) => {
            action.getParents().forEach((parentName) => {
                const parentMenu = this.getMenu(parentName);
                if (parentMenu instanceof MenuField || parentMenu instanceof MenuChoice) {
                    if (!parentMenu.getOption(action.getName())) {
                        parentMenu.addOption(action);
                    }
                }
            });
        });
        return this;
    }

    // Main dispatcher

    /**
     * Runs the default entry item ("main").
     */
    public run(): Promise<this>;

    /**
     * Runs an item by name.
     *
     * @param value Menu/action name.
     * @param parent Optional parent context (name or instance).
     */
    public run(value: string, parent?: string | Menu | Action): Promise<this>;

    /**
     * Runs an item instance directly.
     *
     * @param value Menu or Action instance.
     * @param parent Optional parent context (name or instance).
     */
    public run(value: Menu | Action, parent?: string | Menu | Action): Promise<this>;

    public async run(value: string | Menu | Action = "main", parent?: string | Menu | Action): Promise<this> {
        if (typeof parent === "string") {
            parent = this.getMenu(parent) || this.getAction(parent);
        }
        const parentName = parent ? (typeof parent === "string" ? parent : parent.getName()) : undefined;

        const item =
            typeof value === "string"
                ? this.getMenu(value)
                || this.getAction(value)
                || (value.startsWith("back_") && (parent instanceof MenuField || parent instanceof MenuChoice)
                    ? (parent.getOption(value)?.getItem() as ActionGoto | undefined)
                    : undefined)
                : value
        ;
        if (item instanceof MenuInput) {
            await this.runMenuInput(item, parentName);
        } else if (item instanceof MenuEditor) {
            await this.runMenuEditor(item, parentName);
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

    /**
     * Serializes current menus and actions into plugin-compatible JSON.
     */
    public toJson(): Omit<PluginJson, "name" | "version" | "translations"> {
        return {
            menus: this.getMenus().map((m) => m.toJson() as Exclude<PluginJson["menus"], undefined>[number]),
            actions: this.getActions().map((a) => a.toJson() as Exclude<PluginJson["actions"], undefined>[number]),
        };
    }
}

export { Cli };
