import { Label } from "../translations";

type MenuLabelsJson = {
    question?: string;
    title?: string;
    success?: string;
    error?: string;
};

class MenuLabels {
    protected question?: Label;
    protected title?: Label;
    protected success?: Label;
    protected error?: Label;

    constructor(data: MenuLabelsJson) {
        this.question = data.question ? new Label(data.question) : undefined;
        this.title = data.title ? new Label(data.title) : undefined;
        this.success = data.success ? new Label(data.success) : undefined;
        this.error = data.error ? new Label(data.error) : undefined;
    }

    public getQuestion(): MenuLabels["question"] {
        return this.question;
    }
    public setQuestion(
        question: NonNullable<MenuLabels['question'] | MenuLabelsJson['question']>,
        callback?: Label['callback'],
    ): this {
        this.question = question instanceof Label 
            ? new Label(question.getName(), callback ?? question.getCallback())
            : new Label(question);
        return this;
    }

    public getTitle(): MenuLabels["title"] {
        return this.title;
    }
    public setTitle(
        title: NonNullable<MenuLabels['title'] | MenuLabelsJson['title']>,
        callback?: Label['callback'],
    ): this {
        this.title = title instanceof Label 
            ? new Label(title.getName(), callback ?? title.getCallback())
            : new Label(title);
        return this;
    }

    public getSuccess(): MenuLabels["success"] {
        return this.success;
    }
    public setSuccess(
        success: NonNullable<MenuLabels['success'] | MenuLabelsJson['success']>,
        callback?: Label['callback'],
    ): this {
        this.success = success instanceof Label 
            ? new Label(success.getName(), callback ?? success.getCallback())
            : new Label(success);
        return this;
    }

    public getError(): MenuLabels["error"] {
        return this.error;
    }
    public setError(
        error: NonNullable<MenuLabels['error'] | MenuLabelsJson['error']>,
        callback?: Label['callback'],
    ): this {
        this.error = error instanceof Label 
            ? new Label(error.getName(), callback ?? error.getCallback())
            : new Label(error);
        return this;
    }

    public toJson(): MenuLabelsJson {
        return {
            ...(this.question ? { question: this.question.getValue() } : {}),
            ...(this.title ? { title: this.title.getValue() } : {}),
            ...(this.success ? { success: this.success.getValue() } : {}),
            ...(this.error ? { error: this.error.getValue() } : {}),
        };
    }
}

export { type MenuLabelsJson, MenuLabels };