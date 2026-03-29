import { Language, Translations } from "../translations";
import { MenuStyles, MenuStylesJson } from "./styles";
import { MenuLabels, MenuLabelsJson } from "./labels";


type MenuJson = {
    name: string;
    type: "choice" | "input" | "field";
    plugin?: string;
    index?: number;
    parents?: string[];
    global?: boolean;
    styles?: MenuStylesJson;
    labels?: MenuLabelsJson;
};

abstract class Menu {
    protected name: MenuJson["name"];
    protected abstract type: MenuJson["type"];
    protected plugin?: MenuJson["plugin"];
    protected parents: Record<string, Exclude<MenuJson["parents"], undefined>[number]> = {};
    protected index: MenuJson["index"];
    protected global: Exclude<MenuJson["global"], undefined>;
    protected styles: MenuStyles;
    protected labels: MenuLabels;

    constructor(data: MenuJson) {
        this.name = data.name;
        this.plugin = data.plugin;
        this.index = data.index;
        this.global = data.global ?? false;
        this.styles = new MenuStyles(data.styles);
        this.labels = new MenuLabels(data.labels);

        if (data.parents) {
            data.parents.forEach((parent) => this.addParent(parent));
        }
    }

    public getName(): Menu["name"] {
        return this.name;
    }

    public getType(): Menu["type"] {
        return this.type;
    }

    public getPlugin(): Menu["plugin"] | undefined {
        return this.plugin;
    }
    public setPlugin(plugin: Menu["plugin"]): this {
        this.plugin = plugin;
        return this;
    }

    public getIndex(): Menu["index"] | undefined {
        return this.index;
    }
    public setIndex(index: Menu["index"]): this {
        this.index = index;
        return this;
    }

    public getParents(): Menu["parents"][string][] {
        return Object.values(this.parents);
    }
    public getParent(name: string): Menu["parents"][string] | undefined {
        return this.parents[name];
    }
    public addParent(name: Menu["parents"][string]): this {
        this.parents[name] = name;
        return this;
    }

    public isGlobal(): Menu["global"] {
        return this.global === true;
    }

    public getStyles(): MenuStyles {
        return this.styles;
    }
    public setStyles(styles: MenuStyles | MenuStylesJson): this {
        this.styles = styles instanceof MenuStyles ? styles : new MenuStyles(styles);
        return this;
    }

    public getQuestionName(): string {
        return `${this.getPlugin() ?? "default"}.${this.getName()}.question`;
    }
    public getLabels(): MenuLabels {
        return this.labels;
    }
    public setLabels(labels: MenuLabels | MenuLabelsJson): this {
        this.labels = labels instanceof MenuLabels ? labels : new MenuLabels(labels);
        return this;
    }

    public getQuestionLabel(language?: Language): string {
        const key = this.getQuestionName();
        const translated = Translations.getTranslation(key, language);
        const q = this.labels.getQuestion();
        return translated !== key ? translated : q && q.length > 0 ? q : key;
    }

    public getTitleName(): string {
        return `${this.getPlugin() ?? "default"}.${this.getName()}.title`;
    }
    public getTitleLabel(language?: Language): string {
        const key = this.getTitleName();
        const translated = Translations.getTranslation(key, language);
        const t = this.labels.getTitle();
        return translated !== key ? translated : t && t.length > 0 ? t : key;
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
        const s = this.labels.getSuccess();
        return translated !== key ? translated : s && s.length > 0 ? s : key;
    }

    public getErrorName(): string {
        return `${this.getPlugin() ?? "default"}.${this.getName()}.error`;
    }
    public getErrorLabel(language?: Language): string {
        const key = this.getErrorName();
        const translated = Translations.getTranslation(key, language);
        if (translated !== key) {
            return translated;
        }
        const e = this.labels.getError();
        if (e && e.length > 0) {
            return e;
        }
        const generic = "default.input.error";
        const genericTranslated = Translations.getTranslation(generic, language);
        return genericTranslated !== generic ? genericTranslated : key;
    }

    public toJson(): MenuJson {
        const stylesJson = this.styles.toJson();
        const hasStyles = stylesJson.idle || stylesJson.hover || stylesJson.selected;
        const labelsJson = this.labels.toJson();
        const hasLabels = labelsJson.question || labelsJson.title || labelsJson.success || labelsJson.error;

        return {
            name: this.name,
            type: this.type,
            plugin: this.plugin,
            index: this.index,
            parents: this.getParents(),
            global: this.global,
            ...(hasStyles ? { styles: stylesJson } : {}),
            ...(hasLabels ? { labels: labelsJson } : {}),
        };
    }

    public abstract run(): Promise<unknown>;
}

export { Menu, MenuStyles, MenuLabels, type MenuJson, type MenuStylesJson, type MenuLabelsJson };
