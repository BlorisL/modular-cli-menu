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
import { addPlugin } from 'modular-cli-menu';
import type { PluginType, ActionType } from 'modular-cli-menu';

const myPlugin: PluginType = {
    menu: {
        name: 'myplugin',           // Unique menu name
        parent: 'main',             // Parent menu (optional)
        color: 'blue',              // Menu color (optional)
        choices: [                  // Array of available actions
            'menu.myplugin.action1',
            'menu.myplugin.action2',
            'menu.action.back'
        ]
    },
    actions: {
        'menu.myplugin.action1': {
            type: 'function',
            name: 'menu.myplugin.action1',
            color: 'green',
            options: {
                message: {
                    text: 'Action 1 executed!',
                    color: 'green'
                }
            }
        }
    },
    languages: {
        en: {
            'menu.myplugin.question': 'My Plugin',
            'menu.myplugin.action1': 'Execute Action 1',
            'menu.myplugin.action2': 'Execute Action 2'
        }
    }
};
```

In the main file remember to register the plugin
```typescript
import module1 from './plugins/myPlugin/index.ts';
import { addPlugin, print } from 'modular-cli-menu';

addPlugin(myPlugin);

print();
```

## Navigation and Control Methods

The library provides several methods for menu navigation and control:

### actionExit

`menu.action.exit` can be used to terminate the application. 
Add it to your menu's choices:

```typescript
import { actionExit } from 'modular-cli-menu';

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

`menu.action.back` can be used to navigate to the previous menu. 
Add it to your menu's choices:

```typescript
import { actionGoBack } from 'modular-cli-menu';

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
import { waitForKeyPress } from 'modular-cli-menu';

const myAction: ActionType = {
    type: 'function',
    options: {
        callback: async (parent?:) => {
            await waitForKeyPress();
            // Continue with the next actions
        }
    }
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
    options: {
        menu: 'targetMenuName'
    }
}
```

## Support me

[Share with me a cup of tea](https://www.buymeacoffee.com/bloris) ☕