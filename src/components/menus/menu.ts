import { ColorName } from "chalk";
import { Language, Translations } from "../translations";

type MenuJson = {
    name: string;
    type: 'choice' | 'input';
    plugin?: string;
    index?: number;
    color?: ColorName;
    parents?: string[]
}

abstract class Menu {
    protected name: MenuJson['name'];
    protected abstract type: MenuJson['type'];
    protected plugin?: MenuJson['plugin'];
    protected parents: Record<string, Exclude<MenuJson['parents'], undefined>[number]> = {};
    protected index: MenuJson['index'];
    protected color: MenuJson['color'];

    constructor(data: MenuJson) {
        this.name = data.name;
        this.plugin = data.plugin;
        this.index = data.index;
        this.color = data.color;

        if(data.parents) {
            data.parents.forEach(parent => this.addParent(parent));
        }
    }

    public getName(): Menu['name'] { return this.name; }

    public getType(): Menu['type'] { return this.type; }

    public getPlugin(): Menu['plugin'] | undefined { return this.plugin; }
    public setPlugin(plugin: Menu['plugin']): this { this.plugin = plugin; return this; }

    public getIndex(): Menu['index'] | undefined { return this.index; }
    public setIndex(index: Menu['index']): this { this.index = index; return this; }

    public getColor(): Menu['color'] | undefined { return this.color; }
    public setColor(color: Menu['color']): this { this.color = color; return this; }

    public getParents(): Menu['parents'][string][] { return Object.values(this.parents); }
    public getParent(name: string): Menu['parents'][string] | undefined { 
        return this.parents[name]; 
    }
    public addParent(name: Menu['parents'][string]): this { 
        this.parents[name] = name; 
        return this; 
    }

    public getQuestionName(menu: Menu): string {
        return `${menu.getPlugin() ?? 'default'}.${menu.getName()}.question`;
    }
    public getQuestionLabel(menu: Menu, language?: Language): string {
        const name = this.getQuestionName(menu);
        return Translations.getTranslation(name, language) ?? name;
    }

    public getTitleName(menu: Menu): string {
        return `${menu.getPlugin() ?? 'default'}.${menu.getName()}.title`;
    }
    public getTitleLabel(menu: Menu, language?: Language): string {
        const name = this.getTitleName(menu);
        return Translations.getTranslation(name, language) ?? name;
    }

    public toJson(): MenuJson {
        return {
            name: this.name,
            type: this.type,
            plugin: this.plugin,
            index: this.index,
            color: this.color,
            parents: this.getParents()
        };
    }

    public abstract run(): Promise<unknown>;
}

export { Menu, type MenuJson };