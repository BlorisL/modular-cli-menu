import { Menu } from "./classes/menus/menu";
import { Action } from "./classes/actions/action";

export type Parent = Menu | Action | null;

export interface ActionConfig {
    type: 'function' | 'goto' | 'back' | 'exit';
    key: string;
    fn?: () => Promise<void> | void;
    targetMenuId?: string;
    after?: 'none' | 'rerender' | 'back';
}

export interface MenuConfig {
    type: 'choice' | 'input';
    id: string;
    key: string;
    customActions?: string[];
    onSubmit?: (value: string) => void;
    register?: boolean;
    parent?: string; // ID del menu genitore, opzionale
}

export interface PluginConfig {
    name: string;
    menus?: Record<string, MenuConfig>;
    actions?: Record<string, ActionConfig>;
    globalGoto?: { label: string; targetMenuId: string };
    translations?: Record<"it" | "en" | "de", Record<string, string>>; // nuovo campo per estensioni
}

export type GlobalActionProvider = (menu: Menu) => Action | null; // Modificato per consentire null