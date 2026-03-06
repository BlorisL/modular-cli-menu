import { Utility } from '@/components/utility';
import { MenuFieldConfigDefaults, MenuFieldConfigDefaultsJson } from './defaults';
import { MenuFieldConfigSelected, MenuFieldConfigSelectedJson } from './selected';

type MenuFieldConfigsJson = {
    defaults?: MenuFieldConfigDefaultsJson;
    selected?: boolean | MenuFieldConfigSelectedJson;
};

class MenuFieldConfigs {
    protected defaults?: MenuFieldConfigDefaults;
    protected selected?: MenuFieldConfigSelected;

    constructor(
        defaults?: MenuFieldConfigDefaults | MenuFieldConfigDefaultsJson,
        selected?: MenuFieldConfigSelected | MenuFieldConfigsJson['selected']
    ) {
        if (defaults) this.setDefaults(defaults);
        if (selected) this.setSelected(selected);
    }

    public getDefaults(): MenuFieldConfigs['defaults'] | undefined { return this.defaults; }
    public setDefaults(defaults?: MenuFieldConfigDefaults | MenuFieldConfigDefaultsJson): this {
        if (defaults instanceof MenuFieldConfigDefaults) {
            this.defaults = new MenuFieldConfigDefaults(defaults.getValues(), defaults.getCallback());
        } else if (typeof defaults === 'object') {
            this.defaults = new MenuFieldConfigDefaults(defaults.values ?? [], defaults.callback);
        }
        return this;
    }

    public getSelected(): MenuFieldConfigs['selected'] | undefined { return this.selected; }
    public setSelected(selected: Exclude<MenuFieldConfigSelected | MenuFieldConfigsJson['selected'], undefined>): this {
        if (selected instanceof MenuFieldConfigSelected) {
            this.selected = new MenuFieldConfigSelected(
                selected.getPrefix() ?? Utility.getDefaultPrefix(),
                selected.getColor()  ?? Utility.getDefaultColor()
            );
        } else if (typeof selected === 'object') {
            this.selected = new MenuFieldConfigSelected(
                selected.prefix ?? Utility.getDefaultPrefix(),
                selected.color  ?? Utility.getDefaultColor()
            );
        } else if (selected === true) {
            this.selected = new MenuFieldConfigSelected(
                Utility.getDefaultPrefix(),
                Utility.getDefaultColor()
            );
        }
        return this;
    }

    public toJson(): MenuFieldConfigsJson {
        const defaults = this.defaults
            ? {
                values: this.defaults.getValues(),
                callback: this.defaults.getCallback(),
            }
            : undefined;

        const selected = this.selected
            ? {
                prefix: this.selected.getPrefix(),
                color: this.selected.getColor(),
            }
            : undefined;

        return {
            ...(defaults ? { defaults } : {}),
            ...(selected ? { selected } : {}),
        };
    }
}

export { type MenuFieldConfigsJson, MenuFieldConfigs };