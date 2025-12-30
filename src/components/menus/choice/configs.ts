import { Utility } from "@/components/utility";
import { MenuChoiceConfigDefaults, MenuChoiceConfigDefaultsJson } from "./defaults";
import { MenuChoiceConfigSelected, MenuChoiceConfigSelectedJson } from "./selected";

type MenuChoiceConfigsJson = {
    defaults?: MenuChoiceConfigDefaultsJson,
    selected?: boolean | MenuChoiceConfigSelectedJson
};

class MenuChoiceConfigs {
    protected defaults?: MenuChoiceConfigDefaults = undefined; //MenuChoiceConfigDefaultsJson;
    protected selected?: MenuChoiceConfigSelected = undefined; //Exclude<MenuChoiceConfigsJson['selected'], undefined | boolean>;

    constructor(
        defaults?: MenuChoiceConfigDefaults | MenuChoiceConfigDefaultsJson, 
        selected?: MenuChoiceConfigSelected | MenuChoiceConfigsJson['selected']
    ) {
        if(defaults) {
            this.setDefaults(defaults);
        }
        if(selected) {
            this.setSelected(selected);
        }
    }

    public getDefaults(): MenuChoiceConfigs['defaults'] | undefined { return this.defaults; }
    public setDefaults(
        defaults?: MenuChoiceConfigDefaults | MenuChoiceConfigsJson['defaults']
    ): this { 
        if(defaults instanceof MenuChoiceConfigDefaults) {
            this.defaults = new MenuChoiceConfigDefaults(
                defaults.getValues(),
                defaults.getCallback()
            );
        } else if(typeof defaults === 'object') {
            this.defaults = new MenuChoiceConfigDefaults(
                defaults.values ?? [],
                defaults.callback
            );
        }

        return this;
    }

    public getSelected(): MenuChoiceConfigs['selected'] | undefined { return this.selected; }
    public setSelected(
        selected: Exclude<MenuChoiceConfigSelected | MenuChoiceConfigsJson['selected'], undefined>
    ): this { 
        if(selected instanceof MenuChoiceConfigSelected) {
            this.selected = new MenuChoiceConfigSelected(
                selected.getPrefix() ?? Utility.getDefaultPrefix(),
                selected.getColor() ?? Utility.getDefaultColor()
            );
        } else if(typeof selected === 'object') {
            this.selected = new MenuChoiceConfigSelected(
                selected.prefix ?? Utility.getDefaultPrefix(),
                selected.color ?? Utility.getDefaultColor()
            );
        } else if(selected === true) {
            this.selected = new MenuChoiceConfigSelected(
                Utility.getDefaultPrefix(),
                Utility.getDefaultColor()
            );
        }

        return this;
    }
}

export {
    type MenuChoiceConfigsJson,
    MenuChoiceConfigs
}