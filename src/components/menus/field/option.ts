import { Menu } from '../menu';
import { Action } from '../../actions';
import { Language, Translations } from '../../translations';
import { Utility } from '../../utility';
import { MenuFieldConfigSelected, MenuFieldConfigSelectedJson } from './selected';
import { ColorName } from "chalk";

type MenuFieldOptionJson = {
    value: string;
    label?: string;
    multi?: boolean;
    color?: ColorName;
    selected?: MenuFieldConfigSelectedJson;
};

class MenuFieldOption {
    protected value: string | Menu | Action;
    protected label: string;
    protected multi: boolean;
    protected color?: import('chalk').ColorName;
    protected selected?: MenuFieldConfigSelected;

    constructor(
        value: string | Menu | Action,
        label?: string,
        multi?: boolean,
        color?: import('chalk').ColorName,
        selected?: import('./selected').MenuFieldConfigSelectedJson
    ) {
        this.value  = value;
        this.label  = label ?? (typeof value === 'string' ? value : value.getName());
        this.multi  = multi ?? false;
        this.color  = color;
        this.selected = selected
            ? new MenuFieldConfigSelected(selected.prefix, selected.color)
            : undefined;
    }

    public getValue(): string { return typeof this.value === 'string' ? this.value : this.value.getName(); }
    public setValue(value: MenuFieldOption['value']): this { this.value = value; return this; }

    public getLabel(): string { return this.label; }

    public getColor(): MenuFieldOption['color'] | undefined { return this.color; }
    public setColor(color: MenuFieldOption['color']): this { this.color = color; return this; }

    public isMulti(): boolean { return this.multi; }

    public getIndex(): number | undefined {
        return typeof this.value === 'string' ? undefined : this.value.getIndex();
    }

    public getItem(): Exclude<MenuFieldOption['value'], string> | undefined {
        return typeof this.value === 'string' ? undefined : this.value;
    }

    public getSelected(): MenuFieldConfigSelected | undefined { return this.selected; }
    public getSelectedPrefix(): string | undefined { return this.selected?.getPrefix(); }
    public setSelectedPrefix(prefix?: string): this {
        if (!this.selected) this.selected = new MenuFieldConfigSelected();
        this.selected.setPrefix(prefix);
        return this;
    }
    public getSelectedColor(): import('chalk').ColorName | undefined { return this.selected?.getColor(); }
    public setSelectedColor(color?: import('chalk').ColorName): this {
        if (!this.selected) this.selected = new MenuFieldConfigSelected();
        this.selected.setColor(color);
        return this;
    }

    public getTranslationLabel(isSelected?: boolean, language?: Language): string {
        let prefix = '';
        let color  = this.getColor();

        if (isSelected) {
            if (this.getSelected()?.getColor()) color = this.getSelected()?.getColor();
            const p = this.getSelected()?.getPrefix() ?? '';
            if (p.length > 0) prefix = `${p} `;
        }

        const translation = this.getItem()?.getTitleLabel(language)
            ?? Translations.getTranslation(this.getLabel() ?? this.getValue(), language);

        return Utility.write(`${prefix}${translation}`, color);
    }

    public toJson(): MenuFieldOptionJson {
        return {
            value: this.getValue(),
            label: this.getLabel(),
            multi: this.isMulti(),
        };
    }
}

export {
    type MenuFieldOptionJson,
    MenuFieldOption
}