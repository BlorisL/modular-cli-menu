import js from "@eslint/js";
import tseslint from "typescript-eslint";
import prettier from "eslint-config-prettier";

export default tseslint.config(
    {
        ignores: ["dist/**", "node_modules/**", "logs/**"],
    },
    js.configs.recommended,
    ...tseslint.configs.recommended,
    prettier, // disabilita regole che confliggono con Prettier
    {
        languageOptions: {
            globals: {
                console: "readonly",
                process: "readonly",
                setTimeout: "readonly",
                setInterval: "readonly",
                clearTimeout: "readonly",
                clearInterval: "readonly",
            },
        },
        rules: {
            // ✅ no var
            "no-var": "error",
            "prefer-const": "error",

            // ✅ if con graffe obbligatorie
            //"curly": ["error", "all"],
            //"brace-style": ["error", "1tbs", { "allowSingleLine": false }],

            // ✅ ordine metodi nelle classi
            // constructor → metodi pubblici → metodi privati → static
            "@typescript-eslint/member-ordering": [
                "warn",
                {
                    default: [
                        "static-field",
                        "static-method",
                        "instance-field",
                        "constructor",
                        "public-method",
                        "protected-method",
                        "private-method",
                    ],
                },
            ],

            // ✅ TypeScript specifico
            "@typescript-eslint/no-explicit-any": "warn",
            "@typescript-eslint/explicit-function-return-type": "warn",
            "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
            "@typescript-eslint/no-unused-expressions": "warn",

            // ✅ Node.js buone pratiche
            "no-console": "warn",
            //eqeqeq: "warn", // evita blocchi su casi non auto-fixabili
            "no-undef": "off",
            "no-control-regex": "warn",
            "no-empty": "warn",
            "no-case-declarations": "warn",
            "no-useless-assignment": "warn",
        },
    }
);
