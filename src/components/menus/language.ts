import { MenuChoice, MenuChoiceJson } from "./choice";

class MenuLanguage extends MenuChoice {
    constructor(data: MenuChoiceJson) {
        super(data);
    }

    public override run(): Promise<string[]> {
        console.clear();
        
    }
}