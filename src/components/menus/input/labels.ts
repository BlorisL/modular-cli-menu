import { Label } from "@/components/translations";
import { MenuLabels, MenuLabelsJson } from "@/components/menus/labels";

type MenuInputLabelsJson = MenuLabelsJson & {
    placeholder?: string;
};

class MenuInputLabels extends MenuLabels {
    protected placeholder?: Label;

    /**
     * Creates a new MenuInputLabels (extends MenuLabels) with optional placeholder.
     * @param data JSON object with optional question, title, success, error, answer, and placeholder translation keys.
     */
    constructor(data: MenuInputLabelsJson) {
        super(data);
        this.placeholder = data.placeholder ? new Label(data.placeholder) : undefined;
    }

    /** Returns the placeholder label, or undefined if not set. */
    public getPlaceholder(): MenuInputLabels["placeholder"] {
        return this.placeholder;
    }

    /**
     * Sets the placeholder label from a Label instance or a translation key string.
     * @param placeholder Label instance or translation key.
     * @param callback Optional interpolation callback forwarded to the Label.
     */
    public setPlaceholder(
        placeholder: NonNullable<MenuInputLabels["placeholder"]>): this;
    public setPlaceholder(
        placeholder: string,
        callback?: Label["callback"]
    ): this;
    public setPlaceholder(
        placeholder: NonNullable<MenuInputLabels["placeholder"]> | string,
        callback?: Label["callback"]
    ): this {
        this.placeholder = placeholder instanceof Label
            ? new Label(placeholder.getName(), callback ?? placeholder.getCallback())
            : new Label(placeholder)
        ;
        return this;
    }

    /** Serialises the input labels to a plain JSON-compatible object. */
    public toJson(): MenuInputLabelsJson {
        return {
            ...super.toJson(),
            ...(this.placeholder ? { placeholder: this.placeholder.getName() } : {}),
        };
    }
}

export { type MenuInputLabelsJson, MenuInputLabels };
