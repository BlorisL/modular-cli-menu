import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

class Utility {
    static loadEnv() {
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

    static debugLog(...args: any[]): void {
        if (process.env.DEBUG_LOG === 'true') {
            console.log(...args);
        }
    }
}

export { Utility }