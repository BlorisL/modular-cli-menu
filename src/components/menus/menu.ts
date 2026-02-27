import { ColorName } from "chalk";
import { Language, Translations } from "../translations";

type MenuJson = {
    name: string;
    type: 'choice' | 'input';
    plugin?: string;
    index?: number;
    color?: ColorName;
    parents?: string[];
    global?: boolean;
    /** Direct text for the question prompt (used when translations are disabled). */
    question?: string;
    /** Direct text for the title label (used when translations are disabled). */
    title?: string;
    /** Direct text for the success message (used when translations are disabled). */
    success?: string;
}

abstract class Menu {
    protected name: MenuJson['name'];
    protected abstract type: MenuJson['type'];
    protected plugin?: MenuJson['plugin'];
    protected parents: Record<string, Exclude<MenuJson['parents'], undefined>[number]> = {};
    protected index: MenuJson['index'];
    protected color: MenuJson['color'];
    protected global: Exclude<MenuJson['global'], undefined>;
    protected question?: string;
    protected title?: string;
    protected success?: string;

    constructor(data: MenuJson) {
        this.name = data.name;
        this.plugin = data.plugin;
        this.index = data.index;
        this.color = data.color;
        this.global = data.global ?? false;
        this.question = data.question;
        this.title = data.title;
        this.success = data.success;

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

    public isGlobal(): Menu['global'] { return this.global === true; }

    public getQuestionName(): string {
        return `${this.getPlugin() ?? 'default'}.${this.getName()}.question`;
    }
    public getQuestionLabel(language?: Language): string {
        const key = this.getQuestionName();
        const translated = Translations.getTranslation(key, language);
        return translated !== key 
            ? translated 
            : ((this.question && this.question.length > 0) 
                ? this.question 
                : key
            )
        ;
    }

    public getTitleName(): string {
        return `${this.getPlugin() ?? 'default'}.${this.getName()}.title`;
    }
    public getTitleLabel(language?: Language): string {
        const key = this.getTitleName();
        const translated = Translations.getTranslation(key, language);
        return translated !== key 
            ? translated 
            : ((this.title && this.title.length > 0) 
                ? this.title 
                : key
            )
        ;
    }

    public getAnswerName(name: string): string {
        return `${this.getPlugin() ?? 'default'}.${this.getName()}.answer.${name}`;
    }
    public getAnswerLabel(name: string, language?: Language): string {
        const key = this.getAnswerName(name);
        const translated = Translations.getTranslation(key, language);
        return translated !== key ? translated : name;
    }

    public getSuccessName(): string {
        return `${this.getPlugin() ?? 'default'}.${this.getName()}.success`;
    }
    public getSuccessLabel(language?: Language): string {
        const key = this.getSuccessName();
        const translated = Translations.getTranslation(key, language);
        return translated !== key 
            ? translated 
            : ((this.success && this.success.length > 0) 
                ? this.success 
                : key
            )
        ;
    }

    public toJson(): MenuJson {
        return {
            name: this.name,
            type: this.type,
            plugin: this.plugin,
            index: this.index,
            color: this.color,
            parents: this.getParents(),
            question: this.question,
            title: this.title,
            success: this.success,
        };
    }

    public abstract run(): Promise<unknown>;
}

export { Menu, type MenuJson };