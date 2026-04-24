import { Label } from "@/components/translations";
import { MenuLabels, MenuLabelsJson } from "@/components/menus/labels";

type MenuInputLabelsJson = MenuLabelsJson & {
    placeholder?: string;
};

class MenuInputLabels extends MenuLabels {
    protected placeholder?: Label;

    constructor(data: MenuInputLabelsJson) {
        super(data);
        this.placeholder = data.placeholder ? new Label(data.placeholder) : undefined;
    }

    public getPlaceholder(): MenuInputLabels["placeholder"] {
        return this.placeholder;
    }

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

    public toJson(): MenuInputLabelsJson {
        return {
            ...super.toJson(),
            ...(this.placeholder ? { placeholder: this.placeholder.getName() } : {}),
        };
    }
}

export { type MenuInputLabelsJson, MenuInputLabels };
