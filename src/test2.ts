import { Choice, choices } from "@/prompts/Choices";

type MenuConfig = {
    name: string;
    values: string[];
};

type ActionConfig = {
    name: string;
};

class Menu {
    protected name: string;
    protected values: Array<Menu | Action | string>;

    public constructor(config: MenuConfig) {
        this.name = config.name;
        this.values = config.values;
    }
    
    public getName(): string { return this.name; }

    public getValues(): Array<Menu | Action> { 
        return this.values.filter(value => {
            return typeof value !== 'string'
        });
    }
    public addValue(value: Menu | Action): this { 
        if(this.values.includes(value.getName())) {
            this.values.splice(this.values.indexOf(value.getName()), 1, value);
        } else {
            this.values.push(value);
        } 
        return this;
    }

    public toJson(): MenuConfig {
        return {
            name: this.getName(),
            values: this.getValues().map(value => value.getName())
        };
    }

    public clone(): Menu {
        return new Menu(this.toJson());
    }

    public async print(): Promise<unknown> {
        const answers = await choices({
            message: `Select an action from menu "${this.getName()}"`,
            choices: this.getValues().map(v => {
                return {
                    name: v.getName(),
                    value: v.getName(),
                    isMulti: false
                } as Choice;
            }),
        }) as string[];

        answers.forEach(answer => {
            console.log(answer)
            const item = this.getValues().find(v => v.getName() === answer);

            if(item instanceof Action) {
                item.run();
            } else if(item instanceof Menu) {
                item.print();
            }
        });

        return this;
    }

}

class Action {
    protected name: string;
    protected from?: Menu | Action;

    public constructor(config: ActionConfig) {
        this.name = config.name;
        this.from = undefined;
    }

    public getName(): string { return this.name; }

    public setFrom(from: Menu): this { this.from = from; return this; }
    public getFrom(): Menu | Action | undefined { return this.from; }

    public toJson(): ActionConfig {
        return {
            name: this.getName(),
        };
    }

    public clone(): Action {
        const action = new Action(this.toJson());
        //action.setFrom(this.getFrom()!);
        return action;
    }

    public async run(): Promise<unknown> {
        if(this.getFrom()) {
            if(this.getFrom() instanceof Action) {
                return (this.getFrom() as Action).run();
            } else if(this.getFrom() instanceof Menu) {
                return (this.getFrom() as Menu).print();
            }
        }
    }
}

const back = new Action({ name: 'back' });
const action1 = new Action({ name: 'action1' });
const action2 = new Action({ name: 'action2' });
const subaction1 = new Action({ name: 'subaction1' });
const subaction2 = new Action({ name: 'subaction2' });
const subaction3 = new Action({ name: 'subaction3' });
const subaction4 = new Action({ name: 'subaction4' });

const submenu1 = new Menu({
    name: 'submenu1', 
    values: [ 'subaction1', 'subaction2' ]
});
const submenu2 = new Menu({
    name: 'submenu2', 
    values: [ 'subaction3', 'subaction4' ]
});
const mainMenu = new Menu({
    name: 'main', 
    values: [ 'action1', 'action2' ]
});

submenu1
    .addValue(subaction1)
    .addValue(subaction2)
    .addValue(submenu2)
    .addValue(back.clone().setFrom(mainMenu));

submenu2
    .addValue(subaction3)
    .addValue(subaction4)
    .addValue(back.clone().setFrom(submenu1));

mainMenu
    .addValue(action1)
    .addValue(action2)
    .addValue(submenu1);

mainMenu.print();