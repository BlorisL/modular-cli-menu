import { PluginManager } from "./PluginManager";
import { defaultConfig } from "./plugins/default/defaultConfig";
import { languageConfig } from "./plugins/language/languageConfig";
import { additionalConfig } from "./plugins/additional/additionalConfig";

async function bootstrap() {
    const manager = new PluginManager([
        defaultConfig,
        additionalConfig,
        languageConfig,
    ]);

    manager.load();
    await manager.start("main"); // parte dal mainMenu
}

bootstrap();