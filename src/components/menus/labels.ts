type MenuLabelsJson = {
    question?: string;
    title?: string;
    success?: string;
    error?: string;
};

class MenuLabels {
    private question?: string;
    private title?: string;
    private success?: string;
    private error?: string;

    constructor(data?: MenuLabelsJson) {
        this.question = data?.question;
        this.title = data?.title;
        this.success = data?.success;
        this.error = data?.error;
    }

    public getQuestion(): string | undefined {
        return this.question;
    }
    public setQuestion(question: string): this {
        this.question = question;
        return this;
    }

    public getTitle(): string | undefined {
        return this.title;
    }
    public setTitle(title: string): this {
        this.title = title;
        return this;
    }

    public getSuccess(): string | undefined {
        return this.success;
    }
    public setSuccess(success: string): this {
        this.success = success;
        return this;
    }

    public getError(): string | undefined {
        return this.error;
    }
    public setError(error: string): this {
        this.error = error;
        return this;
    }

    public toJson(): MenuLabelsJson {
        return {
            ...(this.question !== undefined ? { question: this.question } : {}),
            ...(this.title !== undefined ? { title: this.title } : {}),
            ...(this.success !== undefined ? { success: this.success } : {}),
            ...(this.error !== undefined ? { error: this.error } : {}),
        };
    }
}

export { type MenuLabelsJson, MenuLabels };