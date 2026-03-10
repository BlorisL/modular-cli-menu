import { ColorName } from "chalk";
import { Language, Translations } from "../translations";
import { StyleIdle, StyleIdleJson } from "../styles/idle";
import { StyleHover, StyleHoverJson } from "../styles/hover";
import { StyleSelected, StyleSelectedJson } from "../styles/selected";

type MenuJson = {
    name: string;
    type: 'choice' | 'input' | 'field';
    plugin?: string;
    index?: number;
    //color?: ColorName;
    parents?: string[];
    global?: boolean;
    idle?: StyleIdleJson;
    hover?: StyleHoverJson;
    selected?: StyleSelectedJson;
    /** Direct text for the question prompt (used when translations are disabled). */
    question?: string;
    /** Direct text for the title label (used when translations are disabled). */
    title?: string;
    /** Direct text for the success message (used when translations are disabled). */
    success?: string;
    /** Direct text for the validation error message (used when translations are disabled). */
    error?: string;
}

abstract class Menu {
    protected name: MenuJson['name'];
    protected abstract type: MenuJson['type'];
    protected plugin?: MenuJson['plugin'];
    protected parents: Record<string, Exclude<MenuJson['parents'], undefined>[number]> = {};
    protected index: MenuJson['index'];
    //protected color: MenuJson['color'];
    protected global: Exclude<MenuJson['global'], undefined>;
    protected idle?: StyleIdle;
    protected hover?: StyleHover;
    protected selected?: StyleSelected;
    protected question?: string;
    protected title?: string;
    protected success?: string;
    protected error?: string;

    constructor(data: MenuJson) {
        this.name = data.name;
        this.plugin = data.plugin;
        this.index = data.index;
        //this.color = data.color;
        this.global = data.global ?? false;
        this.idle = data.idle
            ? new StyleIdle(data.idle.prefix, data.idle.color, data.idle.underline, data.idle.italic)
            : undefined;
        this.hover = data.hover
            ? new StyleHover(data.hover.prefix, data.hover.color, data.hover.underline, data.hover.italic)
            : undefined;
        this.selected = data.selected
            ? new StyleSelected(data.selected.prefix, data.selected.color, data.selected.underline, data.selected.italic)
            : undefined;
        this.question = data.question;
        this.title = data.title;
        this.success = data.success;
        this.error = data.error;

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

    //public getColor(): Menu['color'] | undefined { return this.color; }
    //public setColor(color: Menu['color']): this { this.color = color; return this; }

    public getParents(): Menu['parents'][string][] { return Object.values(this.parents); }
    public getParent(name: string): Menu['parents'][string] | undefined { 
        return this.parents[name]; 
    }
    public addParent(name: Menu['parents'][string]): this { 
        this.parents[name] = name; 
        return this; 
    }

    public isGlobal(): Menu['global'] { return this.global === true; }

    public getIdle(): StyleIdle | undefined { return this.idle; }
    public setIdle(idle: StyleIdle | StyleIdleJson): this {
        this.idle = idle instanceof StyleIdle ? idle : new StyleIdle(idle.prefix, idle.color, idle.underline, idle.italic);
        return this;
    }

    public getHover(): StyleHover | undefined { return this.hover; }
    public setHover(hover: StyleHover | StyleHoverJson): this {
        this.hover = hover instanceof StyleHover ? hover : new StyleHover(hover.prefix, hover.color, hover.underline, hover.italic);
        return this;
    }

    public getSelected(): StyleSelected | undefined { return this.selected; }
    public setSelected(selected: StyleSelected | StyleSelectedJson): this {
        this.selected = selected instanceof StyleSelected ? selected : new StyleSelected(selected.prefix, selected.color, selected.underline, selected.italic);
        return this;
    }

    public getColor(): ColorName | undefined { return this.idle?.getColor(); }

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

    public getErrorName(): string {
        return `${this.getPlugin() ?? 'default'}.${this.getName()}.error`;
    }
    public getErrorLabel(language?: Language): string {
        const key = this.getErrorName();
        const translated = Translations.getTranslation(key, language);
        if (translated !== key) return translated;
        if (this.error && this.error.length > 0) return this.error;
        // Generic fallback: default.input.error
        const generic = 'default.input.error';
        const genericTranslated = Translations.getTranslation(generic, language);
        return genericTranslated !== generic ? genericTranslated : key;
    }

    public toJson(): MenuJson {
        return {
            name: this.name,
            type: this.type,
            plugin: this.plugin,
            index: this.index,
            //color: this.color,
            parents: this.getParents(),
            idle: this.idle?.toJson(),
            hover: this.hover?.toJson(),
            selected: this.selected?.toJson(),
            question: this.question,
            title: this.title,
            success: this.success,
            error: this.error,
        };
    }

    public abstract run(): Promise<unknown>;
}

export { Menu, type MenuJson };