import { Menu } from "./menus/Menu";
import { Action } from "./actions/Action";

// Un parent può essere un Menu o un'Action
export type Parent = Menu | Action | null;
