import { MenuJson } from '../menu';
import { MenuField, MenuFieldInputModeJson, MenuFieldInputCallback } from '../field';
import { Language } from '../../translations';

// ── JSON

type MenuInputJson = Omit<MenuJson, 'type'> & {
    type: 'input';
    value?: MenuFieldInputModeJson['value'];
    placeholder?: MenuFieldInputModeJson['placeholder'];
    clear?: MenuFieldInputModeJson['clear'];
    fastSubmit?: MenuFieldInputModeJson['fastSubmit'];
    inline?: MenuFieldInputModeJson['inline'];
    validate?: MenuFieldInputModeJson['validate'];
    callback?: MenuFieldInputCallback;
};

// ── Class

class MenuInput extends MenuField {

    constructor(data: MenuInputJson) {
        super({
            ...data,
            type: 'field',
            modes: {
                input: {
                    value: data.value,
                    placeholder: data.placeholder,
                    clear: data.clear,
                    fastSubmit: data.fastSubmit,
                    inline: data.inline,
                    validate: data.validate,
                    callback: data.callback,
                },
            },
        });
    }

    public toJson(): MenuInputJson {
        const base = super.toJson();

        return {
            name: base.name,
            type: 'input',
            plugin: base.plugin,
            index: base.index,
            color: base.color,
            parents: base.parents,
            question: base.question,
            title: base.title,
            success: base.success,
            error: base.error,
            value: this.inputValue || undefined,
            placeholder: this.placeholder || undefined,
            clear: this.clear,
            fastSubmit: this.fastSubmit || undefined,
            inline: this.inline || undefined,
            validate: this.validate || undefined,
            callback: this.inputCallback || undefined,
        };
    }
}

export {
    type MenuInputJson,
    type MenuFieldInputCallback,
    MenuInput,
};