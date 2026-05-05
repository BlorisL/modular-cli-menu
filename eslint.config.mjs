import js from "@eslint/js";
import tseslint from "typescript-eslint";
import stylistic from "@stylistic/eslint-plugin";
import jsoncPlugin from "eslint-plugin-jsonc";

const flowStylePlugin = {
    rules: {
        "no-early-void-return": {
            meta: {
                type: "suggestion",
                docs: {
                    description:
                        "Avoid bare return; inside nested blocks (if/for/while etc.). Use if/else nesting instead.",
                },
                schema: [],
                messages: {
                    noEarlyVoidReturn:
                        "Avoid bare `return;` inside nested blocks. Prefer if/else nesting for project style.",
                },
            },
            create(context) {
                const FUNCTION_TYPES = new Set([
                    "FunctionDeclaration",
                    "FunctionExpression",
                    "ArrowFunctionExpression",
                ]);
                return {
                    ReturnStatement(node) {
                        if (node.argument !== null) {
                            return;
                        }
                        const parent = node.parent;
                        if (parent.type !== "BlockStatement") {
                            return;
                        }
                        const blockParent = parent.parent;
                        if (!FUNCTION_TYPES.has(blockParent.type)) {
                            context.report({ node, messageId: "noEarlyVoidReturn" });
                        }
                    },
                };
            },
        },
        "multiline-ternary-format": {
            meta: {
                type: "layout",
                fixable: "code",
                docs: {
                    description:
                        "Multiline ternary assignments must use: `const x = cond\\n    ? a\\n    : b\\n;`.",
                },
                schema: [],
                messages: {
                    formatRequired:
                        "Multiline ternary: condition on same line as =, branches at +4 indent, ; on its own line.",
                },
            },
            create(context) {
                const sourceCode = context.sourceCode;

                function checkAndFix(statementNode, assignToken, ternaryNode) {
                    if (ternaryNode.loc.start.line === ternaryNode.loc.end.line) {
                        return;
                    }

                    const { test, consequent, alternate } = ternaryNode;

                    // Skip when branches are multiline (complex expressions — leave indentation to @stylistic)
                    if (consequent.loc.start.line !== consequent.loc.end.line) {
                        return;
                    }
                    if (alternate.loc.start.line !== alternate.loc.end.line) {
                        return;
                    }

                    const statementIndent = sourceCode.lines[statementNode.loc.start.line - 1].match(/^(\s*)/)[1];
                    const branchIndent = statementIndent + "    ";

                    const questionMark = sourceCode.getTokenBefore(consequent);
                    const colonMark = sourceCode.getTokenBefore(alternate);
                    const lastToken = sourceCode.getLastToken(statementNode);

                    const isCorrect =
                        assignToken.loc.end.line === test.loc.start.line &&
                        questionMark.loc.start.line !== test.loc.end.line &&
                        questionMark.loc.start.column === branchIndent.length &&
                        colonMark.loc.start.column === branchIndent.length &&
                        lastToken.value === ";" &&
                        lastToken.loc.start.line !== alternate.loc.end.line &&
                        lastToken.loc.start.column === statementIndent.length
                    ;

                    if (isCorrect) {
                        return;
                    }

                    context.report({
                        node: ternaryNode,
                        messageId: "formatRequired",
                        fix(fixer) {
                            const testText = sourceCode.getText(test).trim();
                            const consequentText = sourceCode.getText(consequent).trim();
                            const alternateText = sourceCode.getText(alternate).trim();

                            const newText =
                                ` ${testText}\n${branchIndent}? ${consequentText}\n${branchIndent}: ${alternateText}\n${statementIndent};`
                            ;

                            return fixer.replaceTextRange(
                                [assignToken.range[1], lastToken.range[1]],
                                newText
                            );
                        },
                    });
                }

                return {
                    VariableDeclaration(node) {
                        for (const decl of node.declarations) {
                            if (decl.init?.type === "ConditionalExpression") {
                                const assignToken = sourceCode.getTokenBefore(decl.init);
                                if (assignToken?.value === "=") {
                                    checkAndFix(node, assignToken, decl.init);
                                }
                            }
                        }
                    },
                    ExpressionStatement(node) {
                        if (
                            node.expression.type === "AssignmentExpression" &&
                            node.expression.right.type === "ConditionalExpression"
                        ) {
                            const assignToken = sourceCode.getTokenBefore(node.expression.right);
                            if (assignToken?.value === "=") {
                                checkAndFix(node, assignToken, node.expression.right);
                            }
                        }
                    },
                };
            },
        },
    },
};

const stylisticConfig = stylistic.configs.customize({
    indent: 4,
    quotes: "double",
    semi: true,
    commaDangle: { arrays: "always-multiline", objects: "always-multiline", imports: "always-multiline", exports: "always-multiline", functions: "never" },
    braceStyle: "1tbs",
    jsx: false,
});

export default tseslint.config(
    {
        ignores: ["dist/**", "node_modules/**", "logs/**", "docs/**", "eslint.config.mjs", "tree.ts"],
    },
    js.configs.recommended,
    ...tseslint.configs.recommended,
    stylisticConfig,
    {
        plugins: {
            flowstyle: flowStylePlugin,
        },
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
            curly: ["error", "all"],
            "@stylistic/brace-style": ["error", "1tbs", { allowSingleLine: false }],

            // ✅ operatori: lasciamo libertà di posizionamento — il dangling ; è gestito dalla rule custom
            "@stylistic/operator-linebreak": "off",

            // ✅ parentesi sempre obbligatorie nei parametri delle arrow function
            "@stylistic/arrow-parens": ["error", "always"],

            // ✅ stile flow
            "flowstyle/no-early-void-return": "warn",
            "flowstyle/multiline-ternary-format": "warn",

            // ✅ ordine metodi nelle classi
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
            "no-undef": "off",
            "no-control-regex": "warn",
            "no-empty": "error",
            "no-case-declarations": "error",
            "no-useless-assignment": "error",
        },
    },
    ...jsoncPlugin.configs["flat/recommended-with-jsonc"],
    {
        files: ["**/*.json"],
        rules: {
            "jsonc/indent": ["error", 4],
            "jsonc/quotes": ["error", "double"],
            "jsonc/comma-dangle": ["error", "never"],
            "jsonc/array-bracket-spacing": ["error", "never"],
            "jsonc/object-curly-spacing": ["error", "always"],
            "jsonc/key-spacing": ["error", { beforeColon: false, afterColon: true }],
            "jsonc/comma-style": ["error", "last"],
        },
    }
);
