import { MenuJson } from '../menu';
import { MenuField, MenuFieldChoicesModeJson, MenuFieldOptionJson, MenuFieldJsonValue } from '../field';
import { MenuFieldConfigs, MenuFieldConfigsJson } from '../field/configs';

// ── JSON

type MenuChoiceJson = Omit<MenuJson, 'type'> & {
    type: 'choice';
    values?: MenuFieldChoicesModeJson['values'];
    configs?: MenuFieldConfigsJson;
};

// ── Class

class MenuChoice extends MenuField {

    constructor(data: MenuChoiceJson) {
        super({
            ...data,
            type: 'field',
            modes: {
                choices: {
                    values:  data.values,
                    configs: data.configs,
                },
            },
        });
    }

    public toJson(): MenuChoiceJson {
        const base = super.toJson();
        const choicesValues = Object.values(this.resolveValues()).map(v => v.toJson());

        return {
            name:    base.name,
            type:    'choice',
            plugin:  base.plugin,
            index:   base.index,
            idle:    base.idle,
            hover:   base.hover,
            selected: base.selected,
            parents: base.parents,
            question: base.question,
            title:    base.title,
            success:  base.success,
            error:    base.error,
            ...(choicesValues.length > 0 ? { values: choicesValues as MenuFieldOptionJson[] } : {}),
            ...(this.configs            ? { configs: this.configs.toJson()                  } : {}),
        };
    }
}

export {
    type MenuChoiceJson,
    type MenuFieldJsonValue,
    MenuChoice,
};