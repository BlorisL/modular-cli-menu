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
                "error",
                {
                    default: [
                        "instance-field",
                        "constructor",
                        "static-field",
                        "static-method",
                        "private-method",
                        "protected-method",
                        "public-method",
                    ],
                },
            ],

            // ✅ TypeScript specifico
            "@typescript-eslint/no-explicit-any": "error",
            "@typescript-eslint/explicit-function-return-type": "error",
            "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
            "@typescript-eslint/no-unused-expressions": "error",

            // ✅ Node.js buone pratiche
            "no-console": "warn",
            //eqeqeq: "error", // evita blocchi su casi non auto-fixabili
            "no-undef": "off",
            "no-control-regex": "warn",
            "no-empty": "error",
            "no-case-declarations": "error",
            "no-useless-assignment": "error",
        },
    }
);
