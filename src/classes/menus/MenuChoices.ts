import input from '@inquirer/input';
import { Menu, MenuType, MenuTypes } from "./menu";
import { I18n } from '../Language';
import { choices } from '@/prompts/Choices';

type MenuChoicesType = MenuType & {
    mode: 'input';
    callback?: () => Promise<unknown>;
};

type MenuChoicesOptions = Omit<Parameters<typeof input>[0], 'message'>;

class MenuChoices extends Menu {

    static readonly MODE_NAME = 'input';
    
    protected mode: MenuTypes;
    
    public constructor(params: MenuChoicesType) {
        super(params);
        this.mode = MenuChoices.MODE_NAME;
    }

    public async call(options: MenuChoicesOptions = {}): Promise<unknown> {
        const answer = await choices({
            ...options,
            message: I18n.getNameTranslation(this),
            choices: [...this.getActions(), ...defaultActions]
                .filter(actionLabel => actionLabel === 'separator' || actions.get(actionLabel))
                .map(actionLabel => {
                    if (actionLabel === 'separator') return new Separator();
                    const action = actions.get(actionLabel);
                    return {
                        name: I18n.getNameTranslation(action!),
                        value: action!.getName(),
                        isMulti: typeof actionLabel !== 'string' && actionLabel?.isMulti === true
                    };
                }),
        }) as string[];


        return await Promise.all(
            (actions.some(answer) ?? []).map(action => {
                if (action.getMode() === 'goto' && action.getName() !== 'goback') {
                    menus.addToHistory(this.getName());
                }
                return action.call({ menus, actions });
            })
        );
    }
}

export { 
    MenuChoices,
    type MenuChoicesType
};