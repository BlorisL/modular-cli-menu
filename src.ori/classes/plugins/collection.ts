import { Plugin, PluginType } from "./item";
import { Collection } from "../Collection";

type PluginsType = Record<string, PluginType>;

class Plugins extends Collection<Plugin, PluginType> {
    public constructor(items: PluginsType = {}) {
        super(items, (item) => new Plugin(item));
    }
}

export { 
    Plugins, 
    type PluginsType
};