import { Label } from "@/components/translations";

type MenuFieldOptionLabelsJson = {
    title?: string;
};

class MenuFieldOptionLabels {
    protected title?: Label;

    constructor(data?: MenuFieldOptionLabelsJson) {
        this.title = data?.title ? new Label(data.title) : undefined;
    }

    public getTitle(): MenuFieldOptionLabels["title"] {
        return this.title;
    }

    public setTitle(
        title: NonNullable<MenuFieldOptionLabels["title"] | MenuFieldOptionLabelsJson["title"]>,
        callback?: Label["callback"]
    ): this {
        this.title =
            title instanceof Label ? new Label(title.getName(), callback ?? title.getCallback()) : new Label(title);
        return this;
    }

    public toJson(): MenuFieldOptionLabelsJson {
        return {
            ...(this.title ? { title: this.title.getValue() } : {}),
        };
    }
}

export { type MenuFieldOptionLabelsJson, MenuFieldOptionLabels };
