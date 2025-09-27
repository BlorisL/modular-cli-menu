import input from '@inquirer/input';
import { Menu, MenuType, MenuTypes } from "../item";
import { choices, PromptValue } from '@/prompts/Choices';
import { Separator } from '@inquirer/select';
import { Actions } from '../../actions/collection';
import { I18n } from '../../languages/i18n';
import { Action } from '@/classes/actions/item';

type MenuChoicesOptions = Omit<Parameters<typeof input>[0], 'message'>;
type MenuChoiceDefaultType = string;
type MenuChoiceMultiType = { value: string, multi?: boolean };

type MenuChoicesType = MenuType & {
    mode: 'choices';
    choices?: Array<MenuChoiceDefaultType | MenuChoiceMultiType>;
};

class MenuChoice {
    protected value: MenuChoiceDefaultType | Separator;
    protected multi: boolean;

    public constructor(params: MenuChoiceDefaultType | MenuChoiceMultiType) {
        if(typeof params === 'string') {
            this.value = params;
            this.multi = false;
        } else {
            this.value = params.value;
            this.multi = params.multi ?? false;
        }
    }

    public isSeparator(): boolean { return this.value instanceof Separator; }

    public getValue(): MenuChoiceDefaultType | Separator { return this.value; }
    public setValue(value: MenuChoiceDefaultType): this { 
        value = value.trim();
        if(value.length > 0) {
            this.value = value; 
        } else {
            this.value = new Separator();
        }

        return this;
    }

    public isMulti(): boolean { return this.multi === true; }
    public getIsMulti(): boolean { return this.multi; }
    public setIsMulti(multi: boolean): this { this.multi = multi; return this; }

    public toObject(): MenuChoiceMultiType {
        return {
            value: this.isSeparator() ? '' : (this.getValue() as string),
            multi: this.getIsMulti()
        };
    }
}
class MenuChoices extends Menu {

    static readonly MODE_NAME = 'choices';
    
    protected mode: MenuTypes;
    protected choices: MenuChoice[];
    
    public constructor(params: MenuChoicesType) {
        super(params);
        this.mode = MenuChoices.MODE_NAME;
        this.choices = [];
        params.choices?.forEach(choice => this.addChoice(choice));
    }

    public getChoices(): MenuChoice[] { return this.choices; }

    public addChoice(choice: MenuChoiceDefaultType | MenuChoiceMultiType): this {
        if(typeof choice === 'string') {
            choice = { value: choice, multi: false };
        }
        this.choices.push(new MenuChoice(choice));
        
        return this;
    }

    public toObject(): MenuChoicesType {
        return {
            plugin: this.getPlugin(),
            mode: this.getMode() as MenuChoicesType['mode'],
            name: this.getName(),
            //parent?: string,
            index: this.getIndex(),
            message: this.getMessage(),
            color: this.getColor(),
            choices: this.choices.map(choice => choice.toObject())
        };
    }

    public async print({
            findAction,
            options = {}
        }: {
            findAction: ({ pluginName, actionName }: { pluginName: string; actionName: string }) => Action | undefined;
            options: MenuChoicesOptions
        }
        //actions: Actions, options: MenuChoicesOptions = {}
    ): Promise<PromptValue> {
        const answers = await choices({
            ...options,
            message: I18n.getTranslation(this.getNameTranslation(), this.getColor()),
            choices: this.choices
                .map(choice => {
                    if (choice.isSeparator()) {
                        return new Separator();
                    }

                    const action = findAction({
                        pluginName: this.getPlugin(),
                        actionName: choice.getValue() as string
                    });
                    
                    return {
                        name: I18n.getTranslation(this.getNameTranslation(), this.getColor()),
                        value: action!.getName(),
                        isMulti: choice.isMulti()
                    };
                }),
        }) as string[];


        return await Promise.all(
            (actions.some(answers) ?? []).map(action => {
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