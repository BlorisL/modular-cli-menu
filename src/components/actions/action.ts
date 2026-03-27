import { Language, Translations } from "../translations";
import { StyleIdle, StyleIdleJson } from "../styles/idle";
import { StyleHover, StyleHoverJson } from "../styles/hover";
import { StyleSelected, StyleSelectedJson } from "../styles/selected";

type ActionJsonStyles = {
    idle?: StyleIdleJson;
    hover?: StyleHoverJson;
    selected?: StyleSelectedJson;
};

type ActionJson = {
    name: string;
    type: "function" | "goto";
    plugin?: string;
    index?: number;
    parents?: string[];
    global?: boolean;
    styles?: ActionJsonStyles;
};

abstract class Action {
    protected name: ActionJson["name"];
    protected abstract type: ActionJson["type"];
    protected plugin?: ActionJson["plugin"];
    protected index?: ActionJson["index"];
    protected parents: Record<string, Exclude<ActionJson["parents"], undefined>[number]> = {};
    protected global: Exclude<ActionJson["global"], undefined> = false;
    protected idle?: StyleIdle;
    protected hover?: StyleHover;
    protected selected?: StyleSelected;

    constructor(data: ActionJson) {
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
            ? new StyleSelected(
                  styles.selected.prefix,
                  styles.selected.color,
                  styles.selected.underline,
                  styles.selected.italic
              )
            : undefined;

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

    public getIdle(): StyleIdle | undefined {
        return this.idle;
    }
    public setIdle(idle: StyleIdle | StyleIdleJson): this {
        this.idle =
            idle instanceof StyleIdle ? idle : new StyleIdle(idle.prefix, idle.color, idle.underline, idle.italic);
        return this;
    }

    public getHover(): StyleHover | undefined {
        return this.hover;
    }
    public setHover(hover: StyleHover | StyleHoverJson): this {
        this.hover =
            hover instanceof StyleHover
                ? hover
                : new StyleHover(hover.prefix, hover.color, hover.underline, hover.italic);
        return this;
    }

    public getSelected(): StyleSelected | undefined {
        return this.selected;
    }
    public setSelected(selected: StyleSelected | StyleSelectedJson): this {
        this.selected =
            selected instanceof StyleSelected
                ? selected
                : new StyleSelected(selected.prefix, selected.color, selected.underline, selected.italic);
        return this;
    }

    public getTitleName(): string {
        return `${this.getPlugin() ?? "default"}.${this.getName()}.title`;
    }
    public getTitleLabel(language?: Language): string {
        const name = this.getTitleName();
        return Translations.getTranslation(name, language) ?? name;
    }

    public toJson(): ActionJson {
        const idle = this.idle?.toJson();
        const hover = this.hover?.toJson();
        const selected = this.selected?.toJson();
        const hasStyles = idle || hover || selected;

        return {
            name: this.name,
            type: this.type,
            plugin: this.plugin,
            index: this.index,
            parents: this.getParents(),
            global: this.global,
            ...(hasStyles ? { styles: { idle, hover, selected } } : {}),
        };
    }

    public abstract run(): Promise<unknown>;
}

export { Action, type ActionJson, type ActionJsonStyles };
