import input from '@inquirer/input';
import { Menu, MenuType, MenuTypes } from "../item";
import { I18n } from '../../languages/i18n';

type MenuInputType = MenuType & {
    mode: 'input';
};

type MenuInputOptions = Omit<Parameters<typeof input>[0], 'message'>;

class MenuInput extends Menu {

    static readonly MODE_NAME = 'input';
    
    protected mode: MenuTypes;
    
    public constructor(params: MenuInputType) {
        super(params);
        this.mode = MenuInput.MODE_NAME;
    }

    public toObject(): MenuInputType {
        return {
            plugin: this.getPlugin(),
            mode: this.getMode() as MenuInputType['mode'],
            name: this.getName(),
            //parent?: string,
            index: this.getIndex(),
            message: this.getMessage(),
            color: this.getColor(),
        };
    }

    public async print({
        options = {}
    }: {
        options: MenuInputOptions
    }): Promise<string> {
        const answer = await input({
            ...options as MenuInputOptions,
            message: I18n.getTranslation(this.getNameTranslation(), this.getColor()),
        });

        return answer;
    }
}

export { 
    MenuInput,
    type MenuInputType
};