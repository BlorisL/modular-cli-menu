# Modular CLI Menu

A TypeScript library for creating modular and interactive CLI menus with plugin support and internationalization.

## Installation

```bash
npm install modular-cli-menu
```

## Key Features

- 🔌 Modular plugin system
- 🌍 Multi-language support (i18n)
- 🎨 Customizable menu colors
- 🔄 Hierarchical menu navigation
- ⌨️ Interactive input with different question types
- 📦 Easily extensible

## Basic Usage

```typescript
import { print, write } from 'modular-cli-menu';

// Start the main menu
print();

// Use write for custom messages
write('Hello World', 'green');
```

### Using print and write Methods

The library provides two main methods for output:

- `print()`: Initializes and displays the menu interface
- `write(message: string, color?: ColorName)`: Prints custom messages with optional styling

```typescript
write('Success!', 'green');
write('Error!', 'red');
```

## Creating and Registering Plugins

To create a new plugin, define an object implementing the `PluginType` interface:

```typescript
import { addPlugin, print } from 'modular-cli-menu';

addPlugin({
    menu: {
        name: 'test',
        parent: 'main',
        choices: [
            'menu.test.action1',
            'menu.action.back'
        ]
    },
    actions: {
        'menu.test.action1': {
            type: 'function',
            name: 'menu.test.action1',
            options: {
                message: { text: 'menu.test.action1.message', color: 'green' },
                callback: async () => {
                    // Your logic here
                }
            }
        }
    },
    languages: {
        en: {
            'menu.test.question': 'Test',
            'menu.test.action1.label': 'Action 1',
            'menu.test.action1.message': 'Something',
        },
        it: {
            'menu.test.question': 'Test',
            'menu.test.action1.label': 'Azione 1',
            'menu.test.action1.message': 'Qualcosa',
        }
    }
});

print();
```

In your main file, remember to register the plugin:

```typescript
import myPlugin from './plugins/myPlugin';
import { addPlugin, print } from 'modular-cli-menu';

addPlugin(myPlugin);
print();
```

## Navigation and Control Methods

The library provides several methods for menu navigation and control:

### actionExit

`menu.action.exit` can be used to terminate the application. Add it to your menu's choices:

```typescript
import { actionExit, PluginType } from 'modular-cli-menu';

const myPlugin: PluginType = {
    menu: {
        name: 'myplugin',
        choices: [
            'menu.myplugin.action1',
            'menu.action.exit' // This will add an exit option to your menu
        ]
    },
    // ... rest of the plugin configuration
};
```

### actionGoBack

`menu.action.back` can be used to navigate to the previous menu. Add it to your menu's choices:

```typescript
import { actionGoBack, PluginType } from 'modular-cli-menu';

const myPlugin: PluginType = {
    menu: {
        name: 'myplugin',
        choices: [
            'menu.myplugin.action1',
            'menu.action.back' // This will add a "back" option to your menu
        ]
    },
    // ... rest of the plugin configuration
};
```

### waitForKeyPress

Use `waitForKeyPress()` to pause execution until the user presses a key:

```typescript
import { waitForKeyPress, PluginType } from 'modular-cli-menu';

const myAction: PluginType = {
    type: 'function',
    name: 'myAction',
    options: {
        callback: async (parent) => {
            await waitForKeyPress();
            // Continue with the next actions
        },
    },
};
```

## Action Types

The library supports different types of actions:

1. **function**: Executes a callback function
2. **input**: Requests user input
3. **checkbox**: Allows multiple selections
4. **goto**: Navigates to another menu

### Function Action Example

```typescript
{
    type: 'function',
    name: 'myAction',
    color: 'green',
    options: {
        message: {
            text: 'Action executed!',
            color: 'green'
        },
        callback: async () => {
            // Your logic here
        }
    }
}
```

### Input Action Example

```typescript
{
    type: 'input',
    name: 'inputAction',
    color: 'yellow',
    options: {
        message: {
            text: 'Enter a value:',
            color: 'yellow'
        },
        callback: async (value, parent) => {
            console.log(`Entered value: ${value}`);
        }
    }
}
```

### Checkbox Action Example

```typescript
{
    type: 'checkbox',
    name: 'checkboxAction',
    options: {
        message: {
            text: 'Select options:',
            color: 'cyan',
        },
        choices: ['Option 1', 'Option 2', 'Option 3'],
        callback: async (selected) => {
            console.log('Selected options:', selected);
        }
    }
}
```

### Goto Action Example

```typescript
{
    type: 'goto',
    name: 'gotoAction',
    color: 'blue',
    options: {
        callback: async (to) => {
            // Custom logic before navigating
        },
    },
}
```

## Built-in Plugins: Retry and Language

The library includes some built-in plugins, such as `retry` and `language`, to enhance user experience and internationalization out of the box.

### Retry Plugin

The `retry` plugin provides a menu for handling invalid input or failed actions, allowing users to easily retry an operation.

Example structure:

```typescript
addActionToMenu({
    type: 'input',
    name: 'menu.foo.action',
    options: {
        message: { text: 'menu.foo.action.message'},
        callback: async (value: string) => {
            if (value.length > 0 && fs.existsSync(value)) {
                options.foo = value;
                await waitForKeyPress({ message: 'menu.foo.action.callback.success', color: 'green' });
                await print('main');
            } else {
                await print('retry', {
                    action: 'menu.foo.action', 
                    message: 'menu.foo.action.callback.error', 
                    color: 'red' 
                });
            }
        }
    }
});
```

You can use this plugin to prompt the user to retry an action after an error or invalid input.

### Language Plugin

The `language` plugin allows users to switch the interface language at runtime. It updates the `MENU_LANGUAGE` environment variable and reloads translations.

These plugins are registered automatically, but you can customize or extend them as needed.

## Internationalization (i18n)

You can provide translations for your plugin by adding a `languages` property to your plugin object. The library will automatically merge these translations and use the correct language based on the current environment.

## Support me

[Share with me a cup of tea](https://www.buymeacoffee.com/bloris) ☕