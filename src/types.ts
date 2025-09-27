import { Menu } from "./menus/Menu";
import { Action } from "./actions/Action";
import { App } from "./App";

// Un parent può essere un Menu o un'Action
export type Parent = Menu | Action | null;

export interface Plugin {
    setup(app: App): void;
}