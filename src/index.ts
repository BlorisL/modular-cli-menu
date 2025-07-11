#!/usr/bin/env node

import { I18n } from "./classes/Language";
import { Plugins, Plugin, PluginType } from "./classes/Plugin";

const plugins = new Plugins([
    {
        name: 'main',
        index: 0,
        menus: [{
            mode: 'select',
            name: 'main',
            index: 0,
            message: 'Menu Main',
            color: 'blue',
            actions: [
                'goback',
                'exit'
            ]
        }],
        actions: [
            {
                name: 'goback',
                color: 'blue',
                message: 'action.exit.goback',
                callback: async (args) => {
                    return args.menus.get(args.parent ?? 'default');
                }
                //index: 0
            },
            {
                name: 'exit',
                color: 'red',
                message: 'action.exit.message',
                callback: async (args) => {
                    return;
                }
                //index: 1
            }
        ],
        languages: {
            en: {
                'default.main.title': 'Main Menu',
                'action.exit.message': 'Are you sure you want to exit?'
            },
            it: {
                'default.main.title': 'Menu Principale',
                'action.exit.message': 'Sei sicuro di voler uscire?'
            }
        }
    }
]);

plugins.call('menu', 'main').then(() => {
    //console.log('Done');
}).catch(err => {
    console.error('Error:', err);
});