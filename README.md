# Modular CLI Menu

A flexible, modular command-line interface menu system for Node.js applications with built-in internationalization support.

[![NPM Version](https://img.shields.io/npm/v/modular-cli-menu.svg)](https://www.npmjs.com/package/modular-cli-menu)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Features

- 🧩 **Modular architecture**: Easily create and manage complex menu structures
- 🔄 **Dynamic menus**: Configure menus that adapt based on application state
- 🌍 **Internationalization**: Built-in language switching with customizable translations
- 🎨 **Colorful output**: Use colors to enhance the user experience
- 📋 **Multiple input types**: Support for choices, text input, and more
- 🔌 **Plugin system**: Extend with custom functionality
- ⚙️ **Built-in behaviors**: Pre-configured actions for back navigation, exit, and language switching

## Installation

```bash
npm install modular-cli-menu
```

## Quick Start

```javascript
import { Modular } from 'modular-cli-menu';

const menuSystem = new Modular([
  {
    name: 'default',
    menus: [
      {
        mode: 'choice',
        name: 'main',
        color: 'blue',
        actions: ['testAction', 'exit']
      }
    ],
    actions: [
      {
        mode: 'function',
        name: 'testAction',
        callback: async () => console.log('Action executed!')
      },
      {
        mode: 'function',
        name: 'exit',
        color: 'red',
        callback: async () => process.exit(0)
      }
    ],
    languages: {
      en: {
        'menu.main.question': 'Main Menu',
        'action.testAction.label': 'Run Test',
        'action.exit.label': 'Exit'
      }
    }
  }
]);

// Recommended: Start the main menu using the star() method
menuSystem.start(); 
// or "complex" way menuSystem.call({ type: 'menu', name: 'main' });
```

## Core Concepts

### Plugins

Plugins are the top-level organization units that can contain menus, actions, and language definitions.

```javascript
{
  name: 'pluginName',  // Unique identifier for the plugin
  index: 0,            // Optional ordering index
  menus: [],           // Array of menu configurations
  actions: [],         // Array of action configurations
  languages: {}        // Language translations
}
```

### Menus

Menus represent interactive interfaces for the user.

```javascript
{
  mode: 'choice',      // Type of menu ('choice', 'input', etc.)
  name: 'menuName',    // Unique identifier for the menu
  parent: 'parentMenu', // Optional parent menu name
  color: 'blue',       // Display color
  actions: ['action1', 'action2'] // Available actions in this menu
}
```

### Actions

Actions define what happens when menu options are selected.

```javascript
{
  mode: 'function',    // Action type ('function', 'goto')
  name: 'actionName',  // Unique identifier
  color: 'green',      // Display color
  callback: async (args) => { /* function logic */ }
}
```

### Internationalization

Define translations for different languages:

```javascript
{
  languages: {
    en: {
      'menu.main.question': 'Main Menu',
      'action.exit.label': 'Exit'
    },
    it: {
      'menu.main.question': 'Menu Principale',
      'action.exit.label': 'Esci'
    }
  }
}
```

#### Translation Key Prefixes

The library uses a convention-based system for translation keys. Understanding the prefixes helps you organize and structure your translations effectively:

| Prefix Pattern | Example | Usage |
|---------------|---------|-------|
| `menu.{menuName}.question` | `menu.main.question` | The title/prompt text displayed for a menu |
| `menu.{menuName}.message` | `menu.settings.message` | Descriptive text or instructions for a menu |
| `action.{actionName}.label` | `action.exit.label` | The display label for an action in a menu |
| `action.{actionName}.message` | `action.save.message` | Message displayed when action is executed |
| `menu.{menuName}.success` | `menu.language.success` | Success message for a menu operation |
| `menu.{menuName}.error` | `menu.language.error` | Error message for a menu operation |

These prefixes are automatically recognized by the library's translation system. When you define an action or menu, the system will look for the appropriate translation using these conventions.

Example of comprehensive translations:

```javascript
{
  languages: {
    en: {
      // Menu titles
      'menu.main.question': 'Main Menu',
      'menu.settings.question': 'Settings',
      
      // Action labels
      'action.save.label': 'Save Changes',
      'action.language.label': 'Change Language',
      'action.exit.label': 'Exit',
      
      // Messages
      'action.save.message': 'Changes saved successfully',
      'menu.language.success': 'Language changed successfully',
      'menu.language.error': 'Failed to change language'
    }
  }
}
```

## Built-in Behaviors

The library comes with several pre-configured behaviors to simplify development:

### Navigation Controls

- **Back Navigation**: Easily navigate to previous menus with built-in "Back" actions
- **Exit Function**: Terminate the application gracefully with the included exit action
- **Language Switching**: Change the UI language on-the-fly with the language selection menu

```javascript
// These actions are already available in the library
// Example of built-in actions in a menu configuration:
{
  menus: [
    {
      mode: 'choice',
      name: 'main',
      actions: [
        'language',  // Built-in language selection
        'goback',    // Built-in back navigation
        'exit'       // Built-in exit function
      ]
    }
  ]
}
```

### Wait Screen

- **Wait Screen**: The built-in `wait` menu pauses the flow and prompts the user to press any key before continuing. This is useful after displaying information or completing an action, giving users time to read messages before returning to the previous or main menu.

```javascript
// Example usage after an action or before returning to a menu
await menus.get('wait')?.call();
```

You can customize the message shown in the wait screen using the translation key `menu.wait.question` for each language:

```javascript
{
  languages: {
    en: {
      'menu.wait.question': 'Press any key to continue...'
    },
    it: {
      'menu.wait.question': 'Premi un tasto per continuare...'
    }
  }
}
```

## Advanced Usage

### Dynamic Menus

You can define dynamic menu actions:

```javascript
{
  menus: [
    {
      mode: 'choice',
      name: 'dynamicMenu',
      actions: () => generateDynamicActions()
    }
  ]
}
```

### Custom Input Types

Support for various input types including single choice, multiple choice, and text input:

```javascript
{
  actions: [
    { value: 'option1', isMulti: true },  // Multiple selection option
    'option2',                          // Standard option
  ]
}
```

## Implementation Examples

### Example 1: Basic Menu with Direct Instantiation

```javascript
import { Modular } from 'modular-cli-menu';

// Direct instantiation approach
const menuSystem = new Modular([
  {
    name: 'default',
    menus: [
      {
        mode: 'choice',
        name: 'main',
        color: 'blue',
        actions: ['testAction', 'exit']
      }
    ],
    actions: [
      {
        mode: 'function',
        name: 'testAction',
        callback: async () => console.log('Action executed!')
      },
      {
        mode: 'function',
        name: 'exit',
        callback: async () => process.exit(0)
      }
    ],
    languages: {
      en: {
        'menu.main.question': 'Main Menu',
        'action.testAction.label': 'Run Test',
        'action.exit.label': 'Exit'
      }
    }
  }
]);

menuSystem.call({ type: 'menu', name: 'main' });
```

### Example 2: Using Class Extensions

```javascript
import { Menu, Action, I18n, Modular } from 'modular-cli-menu';

// Extending the Menu class
class MainMenu extends Menu {
  constructor() {
    super({
      mode: 'choice',
      name: 'main',
      color: 'blue',
      actions: ['customAction', 'exit']
    });
  }
}

// Extending the Action class
class CustomAction extends Action {
  constructor() {
    super({
      mode: 'function',
      name: 'customAction',
      color: 'green',
      callback: async () => {
        console.log('Custom action executed!');
        return null;
      }
    });
  }
}

// Create menu system with extended classes
const mainMenu = new MainMenu();
const customAction = new CustomAction();
const exitAction = new Action({
  mode: 'function',
  name: 'exit',
  color: 'red',
  callback: async () => process.exit(0)
});

// Add translations
I18n.addTranslations('en', {
  'menu.main.question': 'Main Menu',
  'action.customAction.label': 'Run Custom Action',
  'action.exit.label': 'Exit'
});

// Initialize and start
const menuSystem = new Modular();
menuSystem.addMenu(mainMenu);
menuSystem.addAction(customAction);
menuSystem.addAction(exitAction);
menuSystem.call({ type: 'menu', name: 'main' });
```

### Example 3: Practical Application with Multiple Menus

```javascript
import { Modular } from 'modular-cli-menu';

const taskManagerApp = new Modular([
  {
    name: 'taskManager',
    menus: [
      {
        mode: 'choice',
        name: 'main',
        color: 'blue',
        actions: ['viewTasks', 'addTask', 'settings', 'exit']
      },
      {
        mode: 'choice',
        name: 'settings',
        parent: 'main',
        color: 'cyan',
        actions: ['language', 'goback']
      },
      {
        mode: 'input',
        name: 'addTask',
        parent: 'main',
        color: 'green'
      }
    ],
    actions: [
      {
        mode: 'function',
        name: 'viewTasks',
        color: 'yellow',
        callback: async ({ menus }) => {
          console.log('Tasks: Task 1, Task 2, Task 3');
          // Wait for user input before returning to main menu
          return await menus.get('wait').call();
        }
      },
      {
        mode: 'function',
        name: 'addTask',
        callback: async ({ value, menus }) => {
          console.log(`Added task: ${value}`);
          return await menus.get('main').call();
        }
      },
      {
        mode: 'goto',
        name: 'settings',
        to: 'settings'
      }
    ],
    languages: {
      en: {
        'menu.main.question': 'Task Manager',
        'menu.settings.question': 'Settings',
        'menu.addTask.question': 'Enter task name:',
        'action.viewTasks.label': 'View Tasks',
        'action.addTask.label': 'Add Task',
        'action.settings.label': 'Settings'
      },
      it: {
        'menu.main.question': 'Gestione Attività',
        'menu.settings.question': 'Impostazioni',
        'menu.addTask.question': 'Inserisci nome attività:',
        'action.viewTasks.label': 'Visualizza Attività',
        'action.addTask.label': 'Aggiungi Attività',
        'action.settings.label': 'Impostazioni'
      }
    }
  }
]);

taskManagerApp.call({ type: 'menu', name: 'main' });
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support me

[Share with me a cup of tea](https://www.buymeacoffee.com/bloris) ☕