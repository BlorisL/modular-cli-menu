import { MenuStyles, MenuStylesJson } from "@/components/menus/styles";
import { MenuLabels, MenuLabelsJson } from "@/components/menus/labels";

type MenuJson = {
    name: string;
    type: "choice" | "input" | "field" | "editor";
    plugin?: string;
    index?: number;
    parents?: string[];
    global?: boolean;
    anchorGlobal?: boolean;
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
    protected anchorGlobal: Exclude<MenuJson["anchorGlobal"], undefined>;
    protected styles: MenuStyles;
    protected labels!: MenuLabels;

    /**
     * Creates a new Menu instance from JSON data.
     * Initializes styles and labels with translation key defaults; concrete subclasses handle type-specific logic.
     * @param data Menu JSON including name, type, plugin, index, parents, styles, and labels.
     */
    constructor(data: MenuJson) {
        this.name = data.name;
        this.plugin = data.plugin;
        this.index = data.index;
        this.global = data.global ?? false;
        this.anchorGlobal = data.anchorGlobal ?? false;
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

    /** Returns the menu's unique name. */
    public getName(): Menu["name"] {
        return this.name;
    }

    /** Returns the menu type: "choice", "input", "field", or "editor". */
    public getType(): Menu["type"] {
        return this.type;
    }

    /** Returns the plugin namespace this menu belongs to, or undefined for the default plugin. */
    public getPlugin(): Menu["plugin"] | undefined {
        return this.plugin;
    }

    /**
     * Sets the plugin namespace for this menu.
     * @param plugin Plugin name string.
     */
    public setPlugin(plugin: Menu["plugin"]): this {
        this.plugin = plugin;
        return this;
    }

    /** Returns the display order index, or undefined if not set. */
    public getIndex(): Menu["index"] | undefined {
        return this.index;
    }

    /**
     * Sets the display order index.
     * @param index Numeric sort position.
     */
    public setIndex(index: Menu["index"]): this {
        this.index = index;
        return this;
    }

    /** Returns all registered parent names as a flat array. */
    public getParents(): Menu["parents"][string][] {
        return Object.values(this.parents);
    }

    /**
     * Returns the parent entry matching the given name, or undefined.
     * @param name Parent name to look up.
     */
    public getParent(name: string): Menu["parents"][string] | undefined {
        return this.parents[name];
    }

    /**
     * Registers a parent menu name.
     * @param name Parent name to add.
     */
    public addParent(name: Menu["parents"][string]): this {
        this.parents[name] = name;
        return this;
    }

    /** Returns true when this menu is accessible from every context. */
    public isGlobal(): Menu["global"] {
        return this.global === true;
    }

    /**
     * Returns true when this menu is the anchor point of a wizard/flow.
     * Global actions that target this menu will be hidden in this menu
     * and in all its descendants, resolved through the regular `parents` chain.
     */
    public isAnchorGlobal(): boolean {
        return this.anchorGlobal === true;
    }

    /** Returns the styles container for this menu. */
    public getStyles(): MenuStyles {
        return this.styles;
    }

    /**
     * Sets the styles for this menu from an instance or a plain JSON object.
     * @param styles MenuStyles instance or compatible JSON.
     */
    public setStyles(styles: MenuStyles): this;
    public setStyles(styles: MenuStylesJson): this;
    public setStyles(styles: MenuStyles | MenuStylesJson): this {
        this.styles = styles instanceof MenuStyles ? styles : new MenuStyles(styles);
        return this;
    }

    /** Returns the labels container for this menu. */
    public getLabels(): Menu["labels"] {
        return this.labels;
    }

    /**
     * Sets the labels for this menu from an instance or a plain JSON object.
     * @param labels MenuLabels instance or compatible JSON.
     */
    public setLabels(labels: MenuLabels): this;
    public setLabels(labels: MenuLabelsJson): this;
    public setLabels(labels: Menu["labels"] | MenuLabelsJson): this {
        this.labels = labels instanceof MenuLabels ? labels : new MenuLabels(labels);
        return this;
    }

    /** Serialises this menu to a plain JSON-compatible object. */
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
            ...(this.anchorGlobal ? { anchorGlobal: this.anchorGlobal } : {}),
            ...(hasStyles ? { styles: stylesJson } : {}),
            ...(hasLabels ? { labels: labelsJson } : {}),
        };
    }

    /** Executes the menu interaction. Implemented by each concrete subclass. */
    public abstract run(): Promise<unknown>;
}

export { Menu, MenuStyles, MenuLabels, type MenuJson, type MenuStylesJson, type MenuLabelsJson };
