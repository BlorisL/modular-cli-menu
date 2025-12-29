import { ColorName } from "chalk";
import { MenuChoiceConfigSelected, MenuChoiceConfigSelectedJson } from "./selected";
import { Utility } from "@/components/utility";
import { Menu } from "@/components/menus";
import { Action } from "@/components/actions";
import { Language, Translations } from "@/components/translations";


type MenuChoiceOptionJson = {
    value: string;
    label?: string;
    multi?: boolean;
    color?: ColorName;
    selected?: MenuChoiceConfigSelectedJson;
};

class MenuChoiceOption {
    protected value: MenuChoiceOptionJson['value'] | Menu | Action;
    protected label: Exclude<MenuChoiceOptionJson['label'], undefined>;
    protected multi: Exclude<MenuChoiceOptionJson['multi'], undefined>;
    protected color?: MenuChoiceOptionJson['color'];
    protected selected?: MenuChoiceConfigSelected;

    constructor(
        value: MenuChoiceOptionJson['value'] | Menu | Action, 
        label?: MenuChoiceOptionJson['label'], 
        multi?: MenuChoiceOptionJson['multi'], 
        color?: MenuChoiceOptionJson['color'],
        selected?: MenuChoiceConfigSelectedJson
    ) {
        this.value = value;
        this.label = label ?? (typeof value === 'string' ? value : value.getName());
        this.multi = multi ?? false;
        this.color = color;
        this.selected = selected ? new MenuChoiceConfigSelected(
            selected.prefix,
            selected.color
        ) : undefined;
    }

    public getValue(): string { return typeof this.value === 'string' ? this.value : this.value.getName(); }
    public setValue(value: MenuChoiceOption['value']): this { this.value = value; return this; }

    public getLabel(): MenuChoiceOption['label'] { return this.label; }

    public getColor(): MenuChoiceOption['color'] | undefined { return this.color; }
    public setColor(color: MenuChoiceOption['color']): this { this.color = color; return this; }

    public isMulti(): MenuChoiceOption['multi'] { return this.multi === true; }

    public getIndex(): number | undefined {
        return typeof this.value === 'string' ? undefined : this.value.getIndex();
    }

    public getItem(): Exclude<MenuChoiceOption['value'], string> | undefined { 
        return typeof this.value === 'string' ? undefined : this.value; 
    }
    public getTranslationLabel(selected?: boolean, language?: Language): string {
        let prefix = '';
        let color = this.getColor();

        if(selected) {
            if(this.getSelected()?.getColor()) {
                color = this.getSelected()?.getColor();
            }
            if((this.getSelected()?.getPrefix() ?? '').length > 0) {
                prefix = `${this.getSelected()?.getPrefix()} `;
            }
        }
        const translation = this.getItem()?.getTitleLabel(language) 
            ?? Translations.getTranslation(this.getLabel() ?? this.getValue(), language)
        ;

        return Utility.write(`${prefix}${translation}`, color);
    }

    public getSelected(): MenuChoiceConfigSelected | undefined { return this.selected; }

    public getSelectedPrefix(): string | undefined { return this.selected?.getPrefix(); }
    public setSelectedPrefix(prefix?: string): this { 
        if(!this.getSelected()) {
            this.selected = new MenuChoiceConfigSelected();
        }
        this.getSelected()!.setPrefix(prefix);
        return this;
    }
    public getSelectedColor(): ColorName | undefined { return this.selected?.getColor(); }
    public setSelectedColor(color?: ColorName): this { 
        if(!this.getSelected()) {
            this.selected = new MenuChoiceConfigSelected();
        }
        this.getSelected()!.setColor(color);
        return this;
    }

    public toJson() {
        const item: {
            value: MenuChoiceOptionJson['value'];
            label: MenuChoiceOptionJson['label'];
            multi: Exclude<MenuChoiceOptionJson['multi'], undefined>;
        } = {
            value: this.getValue(), 
            label: this.getLabel(), //typeof this.value === 'string' ? this.value : this.value.getName(),
            multi: this.isMulti(),
        };
        
        return item;
    }
}

export { 
    type MenuChoiceOptionJson, 
    MenuChoiceOption 
};