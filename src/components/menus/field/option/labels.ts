import { Label } from "@/components/translations";

type MenuFieldOptionLabelsJson = {
    title?: string;
};

class MenuFieldOptionLabels {
    protected title?: Label;

    /**
     * Creates a new MenuFieldOptionLabels.
     * @param data Optional JSON object with title translation key.
     */
    constructor(data?: MenuFieldOptionLabelsJson) {
        this.title = data?.title ? new Label(data.title) : undefined;
    }

    /** Returns the title label, or undefined if not set. */
    public getTitle(): MenuFieldOptionLabels["title"] {
        return this.title;
    }

    /**
     * Sets the title label from a Label instance or a translation key string.
     * @param title Label instance or translation key.
     * @param callback Optional interpolation callback forwarded to the Label.
     */
    public setTitle(
        title: NonNullable<MenuFieldOptionLabels["title"] | MenuFieldOptionLabelsJson["title"]>,
        callback?: Label["callback"]
    ): this {
        this.title =
            title instanceof Label ? new Label(title.getName(), callback ?? title.getCallback()) : new Label(title);
        return this;
    }

    /** Serialises the labels to a plain JSON-compatible object. */
    public toJson(): MenuFieldOptionLabelsJson {
        return {
            ...(this.title ? { title: this.title.getValue() } : {}),
        };
    }
}

export { type MenuFieldOptionLabelsJson, MenuFieldOptionLabels };
