import { Plugin, PluginType } from "./item";

type PluginsType = Record<string, PluginType>;

class Plugins {
    protected items: Record<string, Plugin>;

    public constructor(items: PluginsType = {}) {
        this.items = {};
        Object.keys(items).forEach((key) => this.add(items[key]));
    }
    
    public add(item: PluginType): this { 
        const tmp = new Plugin(item);
        if(tmp !== undefined) {
            this.items[tmp.getName()] = tmp;
        }
        return this; 
    }

    public get(name: string): Plugin | undefined { return this.items[name]; }

    public toObject(): PluginsType {
        const obj: PluginsType = {};
        Object.keys(this.items).forEach((key) => {
            const item = this.items[key];
            obj[key] = item.toObject();
        });
        return obj;
    }

    public toArray(): Plugin[] {
        return Object.values(this.items).sort((a, b) => 
            (a.getIndex() ?? Infinity) - (b.getIndex() ?? Infinity)
        );
    }
}

export { 
    Plugins, 
    type PluginsType
};