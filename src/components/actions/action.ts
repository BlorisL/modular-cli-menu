import { ActionLabels, ActionLabelsJson } from "./labels";
import { ActionStyles, ActionStylesJson } from "./styles";

type ActionJson = {
    name: string;
    type: "function" | "goto";
    plugin?: string;
    index?: number;
    parents?: string[];
    global?: boolean;
    styles?: ActionStylesJson;
    labels?: ActionLabelsJson;
};

abstract class Action {
    protected name: ActionJson["name"];
    protected abstract type: ActionJson["type"];
    protected plugin?: ActionJson["plugin"];
    protected index?: ActionJson["index"];
    protected parents: Record<string, Exclude<ActionJson["parents"], undefined>[number]> = {};
    protected global: Exclude<ActionJson["global"], undefined> = false;
    protected styles: ActionStyles;
    protected labels!: ActionLabels;

    constructor(data: ActionJson) {
        this.name = data.name;
        this.plugin = data.plugin;
        this.index = data.index;
        this.global = data.global ?? false;
        this.styles = new ActionStyles(data.styles);
        this.labels = new ActionLabels({
            title: data.labels?.title ?? `${this.getPlugin() ?? "default"}.${this.getName()}.title`,
        });

        if (data.parents) {
            data.parents.forEach((parent) => this.addParent(parent));
        }
    }

    public getName(): Action["name"] {
        return this.name;
    }
    public getType(): Action["type"] {
        return this.type;
    }

    public getPlugin(): Action["plugin"] | undefined {
        return this.plugin;
    }
    public setPlugin(plugin: Action["plugin"]): this {
        this.plugin = plugin;
        return this;
    }

    public getIndex(): Action["index"] | undefined {
        return this.index;
    }
    public setIndex(index: Action["index"]): this {
        this.index = index;
        return this;
    }

    public getParents(): Action["parents"][string][] {
        return Object.values(this.parents);
    }
    public getParent(name: string): Action["parents"][string] | undefined {
        return this.parents[name];
    }
    public addParent(name: Action["parents"][string]): this {
        this.parents[name] = name;
        return this;
    }

    public isGlobal(): Action["global"] {
        return this.global === true;
    }

    public getStyles(): ActionStyles {
        return this.styles;
    }
    public setStyles(styles: ActionStyles | ActionStylesJson): this {
        this.styles = styles instanceof ActionStyles ? styles : new ActionStyles(styles);
        return this;
    }
    public getLabels(): ActionLabels {
        return this.labels;
    }
    public setLabels(labels: ActionLabels | ActionLabelsJson): this {
        this.labels = labels instanceof ActionLabels ? labels : new ActionLabels(labels);
        return this;
    }

    public toJson(): ActionJson {
        const stylesJson = this.styles.toJson();
        const hasStyles = stylesJson.idle || stylesJson.hover || stylesJson.selected;

        return {
            name: this.name,
            type: this.type,
            plugin: this.plugin,
            index: this.index,
            parents: this.getParents(),
            global: this.global,
            ...(hasStyles ? { styles: stylesJson } : {}),
        };
    }

    public abstract run(): Promise<unknown>;
}

export { Action, ActionStyles, type ActionJson, type ActionStylesJson };
