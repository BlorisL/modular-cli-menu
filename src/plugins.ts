import type { PluginType } from './types';

const plugins: PluginType[] = [
];

function getPlugins(): PluginType[] {
    return plugins;
}

function addPlugin(plugin: PluginType): void {
    if (!plugins.some(p => p.menu.name === plugin.menu.name)) {
        plugins.push(plugin);
    }
}

export { getPlugins, addPlugin };