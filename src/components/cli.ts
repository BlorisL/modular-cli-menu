import { ColorName } from "chalk";
import { Action, ActionFunction, ActionFunctionJson, ActionGoto, ActionGotoJson } from "./actions";
import { Menu, MenuChoice } from "./menus";
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

    public static write(text: string, color?: ColorName): string {
        return Utility.write(text, color);
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
                menuInstance = new MenuChoice(menu);
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
    
    protected getActionTypeBack(menu: MenuChoice): ActionGoto | undefined {
        const item = menu.getValues().find(v => v.getValue().startsWith('back_'));
        return this.getAction(item?.getValue() || '') as ActionGoto | undefined;
    }
    protected hasBackInParents(back: ActionGoto, menu: MenuChoice): boolean {
        return menu.getParents().includes(back.getTo());
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
            ? (this.getMenu(value) || this.getAction(value))
            : value
        ;
        
        if(item instanceof MenuChoice) {
            const parentName = parent 
                ? (typeof parent === 'string' ? parent : parent.getName()) 
                : undefined
            ;

            let back = this.getActionTypeBack(item);
            if(back) {
                if(!this.hasBackInParents(back!, item)) {
                    this.delAction(back!.getName());
                    back = undefined;
                }
            }
            if(!back && item.getName() !== 'main') {
                this.addAction(
                    new ActionGoto(
                        ((this.getAction('back') as ActionGoto).toJson())
                    )
                    .setName(`back_${item.getName()}`)
                    .setTo(parentName ?? 'main')
                )
                const backAction = this.getAction(`back_${item.getName()}`);
                if(backAction) {
                    item.addValue(backAction);
                }
            }

            const exitAction = this.getAction('exit');
            if(exitAction) {
                item.addValue(exitAction);
            }

            (await item.run()).forEach(async answer => 
                await this.run(
                    answer, 
                    item
                )
            );
        } else if(item instanceof ActionFunction) {
            await item.run();
        } else if(item instanceof ActionGoto) {
            return await this.run(item.getTo());
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