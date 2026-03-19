import js from "@eslint/js";
import tseslint from "typescript-eslint";
import prettier from "eslint-config-prettier";

export default tseslint.config(
    js.configs.recommended,
    ...tseslint.configs.recommended,
    prettier, // disabilita regole che confliggono con Prettier
    {
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
                        "static-field",
                        "instance-field",
                        "constructor",
                        "public-method",
                        "protected-method",
                        "private-method",
                        "static-method"
                    ]
                }
            ],

            // ✅ TypeScript specifico
            "@typescript-eslint/no-explicit-any": "warn",
            "@typescript-eslint/explicit-function-return-type": "warn",
            "@typescript-eslint/no-unused-vars": [
                "error", 
                { "argsIgnorePattern": "^_" }
            ],

            // ✅ Node.js buone pratiche
            "no-console": "warn",
            "eqeqeq": ["error", "always"], // usa === non ==
        }
    }
);