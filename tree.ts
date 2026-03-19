// merge-files.ts
import { promises as fs } from "fs";
import * as path from "path";

const EXTENSIONS = [".vue", ".ts", ".js"];
const IGNORED_DIRS = ["node_modules", "dist", "OLD", "src.old", "src.ori", "src2", "classes"]; // opzionale

// Directory di partenza passata da CLI, altrimenti default = current dir
const ROOT_DIR = path.resolve(process.argv[2] || ".");
const OUTPUT_FILE = path.resolve("merged-output.txt");

/**
 * Legge ricorsivamente i file in una directory.
 */
async function getFilesRecursively(dir: string): Promise<string[]> {
    const entries = await fs.readdir(dir, { withFileTypes: true });

    const files = await Promise.all(
        entries.map(async (entry) => {
            const fullPath = path.join(dir, entry.name);

            if (entry.isDirectory()) {
                if (IGNORED_DIRS.includes(entry.name)) {
                    return [];
                }
                return getFilesRecursively(fullPath);
            } else if (EXTENSIONS.includes(path.extname(entry.name))) {
                return [fullPath];
            }

            return [];
        })
    );

    return files.flat();
}

/**
 * Crea un unico file unendo tutti i file selezionati.
 */
async function mergeFiles(): Promise<void> {
    const files = await getFilesRecursively(ROOT_DIR);

    let output = "";

    for (const file of files) {
        const content = await fs.readFile(file, "utf-8");
        const fileName = path.relative(ROOT_DIR, file);

        output += `// ${fileName}\n\n${content}\n\n`;
    }

    await fs.writeFile(OUTPUT_FILE, output, "utf-8");
    console.log(`✅ File creato: ${OUTPUT_FILE}`);
}

mergeFiles().catch(console.error);
