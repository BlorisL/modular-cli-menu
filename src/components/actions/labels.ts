import { Label } from "../translations";

type ActionLabelsJson = {
    title?: string;
};

class ActionLabels {
    protected title?: Label;

    constructor(data?: ActionLabelsJson) {
        this.title = data?.title ? new Label(data.title) : undefined;
    }

    public getTitle(): ActionLabels["title"] | undefined {
        return this.title;
    }
    public setTitle(title: NonNullable<ActionLabels['title'] | ActionLabelsJson['title']>): this {
        this.title = title instanceof Label ? title : new Label(title);
        return this;
    }

    public toJson(): ActionLabelsJson {
        return {
            ...(this.title ? { title: this.title.getValue() } : {}),
        };
    }
}

export { type ActionLabelsJson, ActionLabels };