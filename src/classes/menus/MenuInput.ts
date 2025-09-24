import input from '@inquirer/input';
import { Menu, MenuType, MenuTypes } from "./menu";
import { I18n } from '../Language';

type MenuInputType = MenuType & {
    mode: 'input';
    callback?: () => Promise<unknown>;
};

type MenuInputOptions = Omit<Parameters<typeof input>[0], 'message'>;

class MenuInput extends Menu {

    static readonly MODE_NAME = 'input';
    
    protected mode: MenuTypes;
    protected callback?: () => Promise<unknown>;
    
    public constructor(params: MenuInputType) {
        super(params);
        this.mode = MenuInput.MODE_NAME;
    }

    public async call(options: MenuInputOptions = {}): Promise<unknown> {
        const answer = await input({
            ...options as MenuInputOptions,
            message: I18n.getNameTranslation(this),
        });

        return answer;
    }
}

export { 
    MenuInput,
    type MenuInputType
};