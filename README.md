# Modular CLI Menu System

A flexible and extensible command-line interface menu system built with TypeScript, designed to be easily extendable through plugins.

## Overview

This project provides a modular framework for creating interactive CLI menus with support for:

- Multi-language support (currently English and Italian)
- Plugin-based architecture for easy extension
- Hierarchical menu navigation
- Environment configuration

## Features

- **Plugin System**: Extend functionality by adding new plugins with their own menus and actions
- **Internationalization**: Full multi-language support with automatic translation loading
- **Configurable Navigation**: Define how users navigate through menus after actions complete
- **Dynamic Menu Loading**: Menus and actions are loaded dynamically at runtime

## Project Structure

```
.
├── languages/               # Global translations
│   ├── en.json             # English translations
│   └── it.json             # Italian translations
├── plugins/                # Plugin modules
│   ├── settings/           # Settings plugin
│   └── show-info/          # Information display plugin
├── src/
│   ├── actions/            # Core actions
│   ├── classes/            # Core classes (Menu, MenuItem, etc.)
│   ├── interfaces/         # TypeScript interfaces
│   ├── utils/              # Utility functions
│   └── index.ts            # Application entry point
├── .env                    # Default environment configuration
└── .env.local              # Local environment overrides
```

## How It Works

The application loads menus from configuration files (`menu.json`) found in both the core application and plugins. Each menu item can either lead to a submenu or execute an action.

### Environment Variables

- `LANGUAGE`: Sets the default language (e.g., "en" or "it")
- `DEBUG_LOG`: When set to "true", enables detailed logging

## Adding a New Plugin

To add a new plugin:

1. Create a new directory under `/plugins/`
2. Add a `menu.json` file defining menu structure
3. Add language files under `/languages/` directory
4. Implement actions as TypeScript files in an `actions/` subdirectory

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/BlorisL/modular-cli-menu.git

# Navigate to project directory
cd modular-cli-menu

# Install dependencies
npm install

# Start the application
npm start
```

## Configuration

You can customize the application by creating a `.env.local` file based on the `.env.example` template.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support me

[Share with me a cup of tea](https://www.buymeacoffee.com/bloris) ☕