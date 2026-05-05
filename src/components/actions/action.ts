import { ActionLabels, ActionLabelsJson } from "@/components/actions/labels";
import { ActionStyles, ActionStylesJson } from "@/components/actions/styles";

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

    /**
     * Creates a new Action instance from JSON data.
     * Initializes styles and labels; concrete subclasses handle type-specific logic.
     * @param data Action JSON including name, type, plugin, index, parents, styles, and labels.
     */
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

    /** Returns the action's unique name. */
    public getName(): Action["name"] {
        return this.name;
    }

    /** Returns the action type: "function" or "goto". */
    public getType(): Action["type"] {
        return this.type;
    }

    /** Returns the plugin namespace this action belongs to, or undefined for the default plugin. */
    public getPlugin(): Action["plugin"] | undefined {
        return this.plugin;
    }

    /**
     * Sets the plugin namespace for this action.
     * @param plugin Plugin name string.
     */
    public setPlugin(plugin: Action["plugin"]): this {
        this.plugin = plugin;
        return this;
    }

    /** Returns the display order index, or undefined if not set. */
    public getIndex(): Action["index"] | undefined {
        return this.index;
    }

    /**
     * Sets the display order index.
     * @param index Numeric sort position.
     */
    public setIndex(index: Action["index"]): this {
        this.index = index;
        return this;
    }

    /** Returns all registered parent names as a flat array. */
    public getParents(): Action["parents"][string][] {
        return Object.values(this.parents);
    }

    /**
     * Returns the parent entry matching the given name, or undefined.
     * @param name Parent name to look up.
     */
    public getParent(name: string): Action["parents"][string] | undefined {
        return this.parents[name];
    }

    /**
     * Registers a parent menu name.
     * @param name Parent name to add.
     */
    public addParent(name: Action["parents"][string]): this {
        this.parents[name] = name;
        return this;
    }

    /** Returns true when this action is accessible from every menu. */
    public isGlobal(): Action["global"] {
        return this.global === true;
    }

    /** Returns the styles container for this action. */
    public getStyles(): ActionStyles {
        return this.styles;
    }

    /**
     * Sets the styles for this action from an instance or a plain JSON object.
     * @param styles ActionStyles instance or compatible JSON.
     */
    public setStyles(styles: ActionStyles): this;
    public setStyles(styles: ActionStylesJson): this;
    public setStyles(styles: ActionStyles | ActionStylesJson): this {
        this.styles = styles instanceof ActionStyles ? styles : new ActionStyles(styles);
        return this;
    }

    /** Returns the labels container for this action. */
    public getLabels(): ActionLabels {
        return this.labels;
    }

    /**
     * Sets the labels for this action from an instance or a plain JSON object.
     * @param labels ActionLabels instance or compatible JSON.
     */
    public setLabels(labels: ActionLabels): this;
    public setLabels(labels: ActionLabelsJson): this;
    public setLabels(labels: ActionLabels | ActionLabelsJson): this {
        this.labels = labels instanceof ActionLabels ? labels : new ActionLabels(labels);
        return this;
    }

    /** Serialises this action to a plain JSON-compatible object. */
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

    /** Executes the action logic. Implemented by each concrete subclass. */
    public abstract run(): Promise<unknown>;
}

export { Action, ActionStyles, type ActionJson, type ActionStylesJson };
