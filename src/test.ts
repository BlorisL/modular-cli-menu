import { Choice, choices } from "@/prompts/Choices";

class Menu {
    protected name: string;
    protected values: Array<Menu | Action>;

    public constructor(name: string, values: Array<Menu | Action> = []) {
        this.name = name;
        this.values = values;
    }
    
    public getName(): string { return this.name; }

    public getValues(): Array<Menu | Action> { return this.values; }
    public addValue(value: Menu | Action): this { this.values.push(value); return this; }

    public clone(): Menu {
        return new Menu(this.getName(), this.getValues());
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
            const item = this.values.find(v => v.getName() === answer);

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

    public constructor(name: string) {
        this.name = name;
        this.from = undefined;
    }

    public getName(): string { return this.name; }

    public setFrom(from: Menu): this { this.from = from; return this; }
    public getFrom(): Menu | Action | undefined { return this.from; }

    public clone(): Action {
        const action = new Action(this.getName());
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

const back = new Action('back');

const submenu1 = new Menu('submenu1', [
    new Action('subaction1'),
    new Action('subaction2'),
]);
const submenu2 = new Menu('submenu2', [
    new Action('subaction3'),
    new Action('subaction4'),
]);

const mainMenu = new Menu('main', [
    new Action('action1'),
    new Action('action2'),
]);
submenu1
    .addValue(submenu2)
    .addValue(back.clone().setFrom(mainMenu));
submenu2.addValue(back.clone().setFrom(submenu1));
mainMenu.addValue(submenu1);

mainMenu.print();