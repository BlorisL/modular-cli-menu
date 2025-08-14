import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import stripAnsi from 'strip-ansi';
import input from '@inquirer/input';
import chalk, { ColorName } from "chalk";
import { getTranslation } from "./languages";
import { ActionsType } from './types';

function loadEnv() {
    const envPath = path.resolve(process.cwd(), '.env');
    const envLocalPath = path.resolve(process.cwd(), '.env.local');

    // Load .env first
    if (fs.existsSync(envPath)) {
        dotenv.config({ path: envPath });
    }

    // Then load .env.local, which overrides any variables already loaded
    if (fs.existsSync(envLocalPath)) {
        dotenv.config({ path: envLocalPath, override: true });
    }
}

function debugLog(...args: any[]): void {
    if (process.env.DEBUG_LOG === 'true') {
        console.log(...args);
    }
}

function write(message: string, color?: ColorName) {
    const translation = getTranslation(message);
    return color ? chalk[color](translation) : stripAnsi(translation);
}

function actionExit(): ActionsType {
    return {
        'menu.action.exit': {
            type: 'function',
            name: 'menu.action.exit',
            color: 'red',
            options: { 
                message: {
                    color: 'red',
                    text: 'menu.action.exit.message'
                }
            }
        }
    };
}

function actionGoBack(): ActionsType {
    return {
        'menu.action.back': {
            type: 'goto',
            name: 'menu.action.back',
            color: 'blue',
        }
    };
}

async function waitForKeyPress({
    message, 
    color, 
    default: defaultValue
}: {
    message?: string; 
    color?: ColorName; 
    default?: string;
} = {}): Promise<string> {
    if(!message) {
        message = 'menu.waitforkeypress';
        color = undefined;
        defaultValue = undefined;
    }

    return input({
        message: write(message, color) + '\n',
        default: defaultValue
    });
}

export { 
    loadEnv, 
    debugLog, 
    write, 
    waitForKeyPress, 
    actionExit,
    actionGoBack,
};