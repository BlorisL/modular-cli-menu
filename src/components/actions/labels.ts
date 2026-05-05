import { Label } from "@/components/translations";

type ActionLabelsJson = {
    title?: string;
};

class ActionLabels {
    protected title?: Label;

    /**
     * Creates a new ActionLabels container.
     * @param data Optional JSON object with title translation key.
     */
    constructor(data?: ActionLabelsJson) {
        this.title = data?.title ? new Label(data.title) : undefined;
    }

    /** Returns the title label, or undefined if not set. */
    public getTitle(): ActionLabels["title"] | undefined {
        return this.title;
    }

    /**
     * Sets the title label from a Label instance or a translation key string.
     * @param title Label instance or translation key.
     */
    public setTitle(title: NonNullable<ActionLabels["title"]>): this;
    public setTitle(title: NonNullable<ActionLabelsJson["title"]>): this;
    public setTitle(title: NonNullable<ActionLabels["title"] | ActionLabelsJson["title"]>): this {
        this.title = title instanceof Label ? title : new Label(title);
        return this;
    }

    /** Serialises the labels to a plain JSON-compatible object. */
    public toJson(): ActionLabelsJson {
        return {
            ...(this.title ? { title: this.title.getValue() } : {}),
        };
    }
}

export { type ActionLabelsJson, ActionLabels };
