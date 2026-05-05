import { Label } from "@/components/translations";

type MenuLabelsJson = {
    question?: string;
    title?: string;
    success?: string;
    error?: string;
    answer?: string;
};

class MenuLabels {
    protected answer?: Label;
    protected question?: Label;
    protected title?: Label;
    protected success?: Label;
    protected error?: Label;

    /**
     * Creates a new MenuLabels container with all label types.
     * @param data JSON object with optional question, title, success, error, and answer translation keys.
     */
    constructor(data: MenuLabelsJson) {
        this.answer = data.answer ? new Label(data.answer) : undefined;
        this.question = data.question ? new Label(data.question) : undefined;
        this.title = data.title ? new Label(data.title) : undefined;
        this.success = data.success ? new Label(data.success) : undefined;
        this.error = data.error ? new Label(data.error) : undefined;
    }

    /**
     * Returns the answer label.
     * When a `name` suffix is provided, a new Label is derived by appending `.name` to the base key.
     * @param name Optional suffix appended to the label's translation key.
     */
    public getAnswer(name?: string): Label | undefined {
        let result: Label | undefined;
        if (name === undefined) {
            result = this.answer;
        } else if (!this.answer) {
            result = undefined;
        } else {
            result = new Label(`${this.answer.getName()}.${name}`);
        }
        return result;
    }

    /**
     * Sets the answer label from a Label instance or a translation key string.
     * @param answer Label instance or translation key.
     * @param callback Optional interpolation callback forwarded to the Label.
     */
    public setAnswer(
        answer: NonNullable<MenuLabels["answer"]>): this;
    public setAnswer(
        answer: NonNullable<MenuLabelsJson["answer"]>,
        callback?: Label["callback"]
    ): this;
    public setAnswer(
        answer: NonNullable<MenuLabels["answer"] | MenuLabelsJson["answer"]>,
        callback?: Label["callback"]
    ): this {
        this.answer = answer instanceof Label
            ? new Label(answer.getName(), callback ?? answer.getCallback())
            : new Label(answer, callback)
        ;
        return this;
    }

    /** Returns the question label, or undefined if not set. */
    public getQuestion(): MenuLabels["question"] {
        return this.question;
    }

    /**
     * Sets the question label from a Label instance or a translation key string.
     * @param question Label instance or translation key.
     * @param callback Optional interpolation callback forwarded to the Label.
     */
    public setQuestion(
        question: NonNullable<MenuLabels["question"]>): this;
    public setQuestion(
        question: NonNullable<MenuLabelsJson["question"]>,
        callback?: Label["callback"]
    ): this;
    public setQuestion(
        question: NonNullable<MenuLabels["question"] | MenuLabelsJson["question"]>,
        callback?: Label["callback"]
    ): this {
        this.question = question instanceof Label
            ? new Label(question.getName(), callback ?? question.getCallback())
            : new Label(question)
        ;
        return this;
    }

    /** Returns the title label, or undefined if not set. */
    public getTitle(): MenuLabels["title"] {
        return this.title;
    }

    /**
     * Sets the title label from a Label instance or a translation key string.
     * @param title Label instance or translation key.
     * @param callback Optional interpolation callback forwarded to the Label.
     */
    public setTitle(
        title: NonNullable<MenuLabels["title"]>): this;
    public setTitle(
        title: NonNullable<MenuLabelsJson["title"]>,
        callback?: Label["callback"]
    ): this;
    public setTitle(
        title: NonNullable<MenuLabels["title"] | MenuLabelsJson["title"]>,
        callback?: Label["callback"]
    ): this {
        this.title =
            title instanceof Label ? new Label(title.getName(), callback ?? title.getCallback()) : new Label(title);
        return this;
    }

    /** Returns the success label, or undefined if not set. */
    public getSuccess(): MenuLabels["success"] {
        return this.success;
    }

    /**
     * Sets the success label from a Label instance or a translation key string.
     * @param success Label instance or translation key.
     * @param callback Optional interpolation callback forwarded to the Label.
     */
    public setSuccess(
        success: NonNullable<MenuLabels["success"]>): this;
    public setSuccess(
        success: NonNullable<MenuLabelsJson["success"]>,
        callback?: Label["callback"]
    ): this;
    public setSuccess(
        success: NonNullable<MenuLabels["success"] | MenuLabelsJson["success"]>,
        callback?: Label["callback"]
    ): this {
        this.success = success instanceof Label
            ? new Label(success.getName(), callback ?? success.getCallback())
            : new Label(success)
        ;
        return this;
    }

    /** Returns the error label, or undefined if not set. */
    public getError(): MenuLabels["error"] {
        return this.error;
    }

    /**
     * Sets the error label from a Label instance or a translation key string.
     * @param error Label instance or translation key.
     * @param callback Optional interpolation callback forwarded to the Label.
     */
    public setError(
        error: NonNullable<MenuLabels["error"]>): this;
    public setError(
        error: NonNullable<MenuLabelsJson["error"]>,
        callback?: Label["callback"]
    ): this;
    public setError(
        error: NonNullable<MenuLabels["error"] | MenuLabelsJson["error"]>,
        callback?: Label["callback"]
    ): this {
        this.error =
            error instanceof Label ? new Label(error.getName(), callback ?? error.getCallback()) : new Label(error);
        return this;
    }

    /** Serialises the labels to a plain JSON-compatible object. */
    public toJson(): MenuLabelsJson {
        return {
            ...(this.question ? { question: this.question.getValue() } : {}),
            ...(this.title ? { title: this.title.getValue() } : {}),
            ...(this.success ? { success: this.success.getValue() } : {}),
            ...(this.error ? { error: this.error.getValue() } : {}),
            ...(this.answer ? { answer: this.answer.getName() } : {}),
        };
    }
}

export { type MenuLabelsJson, MenuLabels };
