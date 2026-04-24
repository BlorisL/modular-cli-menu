import { MenuStyles, MenuStylesJson } from "@/components/menus/styles";
import { MenuLabels, MenuLabelsJson } from "@/components/menus/labels";

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
    protected labels!: MenuLabels;

    constructor(data: MenuJson) {
        this.name = data.name;
        this.plugin = data.plugin;
        this.index = data.index;
        this.global = data.global ?? false;
        this.styles = new MenuStyles(data.styles);
        this.labels = new MenuLabels({
            question: data.labels?.question ?? `${this.getPlugin() ?? "default"}.${this.getName()}.question`,
            title: data.labels?.title ?? `${this.getPlugin() ?? "default"}.${this.getName()}.title`,
            success: data.labels?.success ?? `${this.getPlugin() ?? "default"}.${this.getName()}.success`,
            error: data.labels?.error ?? `${this.getPlugin() ?? "default"}.${this.getName()}.error`,
            answer: data.labels?.answer ?? `${this.getPlugin() ?? "default"}.${this.getName()}.answer`,
        });

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

    public getLabels(): Menu["labels"] {
        return this.labels;
    }

    public setLabels(labels: Menu["labels"] | MenuLabelsJson): this {
        this.labels = labels instanceof MenuLabels ? labels : new MenuLabels(labels);
        return this;
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
