import { Language, Translations } from "../translations";
import { StyleIdle, StyleIdleJson } from "../styles/idle";
import { StyleHover, StyleHoverJson } from "../styles/hover";
import { StyleSelected, StyleSelectedJson } from "../styles/selected";

type MenuJsonStyles = {
    idle?: StyleIdleJson;
    hover?: StyleHoverJson;
    selected?: StyleSelectedJson;
};

type MenuJsonLabels = {
    question?: string;
    title?: string;
    success?: string;
    error?: string;
};

type MenuJson = {
    name: string;
    type: "choice" | "input" | "field";
    plugin?: string;
    index?: number;
    parents?: string[];
    global?: boolean;
    styles?: MenuJsonStyles;
    labels?: MenuJsonLabels;
};

abstract class Menu {
    protected name: MenuJson["name"];
    protected abstract type: MenuJson["type"];
    protected plugin?: MenuJson["plugin"];
    protected parents: Record<string, Exclude<MenuJson["parents"], undefined>[number]> = {};
    protected index: MenuJson["index"];
    protected global: Exclude<MenuJson["global"], undefined>;
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
        this.global = data.global ?? false;

        const styles = data.styles;
        this.idle = styles?.idle
            ? new StyleIdle(styles.idle.prefix, styles.idle.color, styles.idle.underline, styles.idle.italic)
            : undefined;
        this.hover = styles?.hover
            ? new StyleHover(styles.hover.prefix, styles.hover.color, styles.hover.underline, styles.hover.italic)
            : undefined;
        this.selected = styles?.selected
            ? new StyleSelected(styles.selected.prefix, styles.selected.color, styles.selected.underline, styles.selected.italic)
            : undefined;

        this.question = data.labels?.question;
        this.title = data.labels?.title;
        this.success = data.labels?.success;
        this.error = data.labels?.error;

        if (data.parents) {
            data.parents.forEach((parent) => this.addParent(parent));
        }
    }

    public getName(): Menu["name"] { return this.name; }

    public getType(): Menu["type"] { return this.type; }

    public getPlugin(): Menu["plugin"] | undefined { return this.plugin; }
    public setPlugin(plugin: Menu["plugin"]): this { this.plugin = plugin; return this; }

    public getIndex(): Menu["index"] | undefined { return this.index; }
    public setIndex(index: Menu["index"]): this { this.index = index; return this; }

    public getParents(): Menu["parents"][string][] { return Object.values(this.parents); }
    public getParent(name: string): Menu["parents"][string] | undefined { return this.parents[name]; }
    public addParent(name: Menu["parents"][string]): this { this.parents[name] = name; return this; }

    public isGlobal(): Menu["global"] { return this.global === true; }

    public getIdle(): StyleIdle | undefined { return this.idle; }
    public setIdle(idle: StyleIdle | StyleIdleJson): this {
        this.idle = idle instanceof StyleIdle
            ? idle
            : new StyleIdle(idle.prefix, idle.color, idle.underline, idle.italic);
        return this;
    }

    public getHover(): StyleHover | undefined { return this.hover; }
    public setHover(hover: StyleHover | StyleHoverJson): this {
        this.hover = hover instanceof StyleHover
            ? hover
            : new StyleHover(hover.prefix, hover.color, hover.underline, hover.italic);
        return this;
    }

    public getSelected(): StyleSelected | undefined { return this.selected; }
    public setSelected(selected: StyleSelected | StyleSelectedJson): this {
        this.selected = selected instanceof StyleSelected
            ? selected
            : new StyleSelected(selected.prefix, selected.color, selected.underline, selected.italic);
        return this;
    }

    public getQuestionName(): string {
        return `${this.getPlugin() ?? "default"}.${this.getName()}.question`;
    }
    public getQuestionLabel(language?: Language): string {
        const key = this.getQuestionName();
        const translated = Translations.getTranslation(key, language);
        return translated !== key
            ? translated
            : this.question && this.question.length > 0
              ? this.question
              : key;
    }

    public getTitleName(): string {
        return `${this.getPlugin() ?? "default"}.${this.getName()}.title`;
    }
    public getTitleLabel(language?: Language): string {
        const key = this.getTitleName();
        const translated = Translations.getTranslation(key, language);
        return translated !== key
            ? translated
            : this.title && this.title.length > 0
              ? this.title
              : key;
    }

    public getAnswerName(name: string): string {
        return `${this.getPlugin() ?? "default"}.${this.getName()}.answer.${name}`;
    }
    public getAnswerLabel(name: string, language?: Language): string {
        const key = this.getAnswerName(name);
        const translated = Translations.getTranslation(key, language);
        return translated !== key ? translated : name;
    }

    public getSuccessName(): string {
        return `${this.getPlugin() ?? "default"}.${this.getName()}.success`;
    }
    public getSuccessLabel(language?: Language): string {
        const key = this.getSuccessName();
        const translated = Translations.getTranslation(key, language);
        return translated !== key
            ? translated
            : this.success && this.success.length > 0
              ? this.success
              : key;
    }

    public getErrorName(): string {
        return `${this.getPlugin() ?? "default"}.${this.getName()}.error`;
    }
    public getErrorLabel(language?: Language): string {
        const key = this.getErrorName();
        const translated = Translations.getTranslation(key, language);
        if (translated !== key) return translated;
        if (this.error && this.error.length > 0) return this.error;
        const generic = "default.input.error";
        const genericTranslated = Translations.getTranslation(generic, language);
        return genericTranslated !== generic ? genericTranslated : key;
    }

    public toJson(): MenuJson {
        const idle = this.idle?.toJson();
        const hover = this.hover?.toJson();
        const selected = this.selected?.toJson();
        const hasStyles = idle || hover || selected;

        const question = this.question;
        const title = this.title;
        const success = this.success;
        const error = this.error;
        const hasLabels = question || title || success || error;

        return {
            name: this.name,
            type: this.type,
            plugin: this.plugin,
            index: this.index,
            parents: this.getParents(),
            global: this.global,
            ...(hasStyles ? { styles: { idle, hover, selected } } : {}),
            ...(hasLabels ? { labels: { question, title, success, error } } : {}),
        };
    }

    public abstract run(): Promise<unknown>;
}

export { Menu, type MenuJson, type MenuJsonStyles, type MenuJsonLabels };