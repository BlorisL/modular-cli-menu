# Skills & Guidelines

This project uses AI-assisted development. All coding guidelines are stored in `.skills/` organized by language:

```
.skills/
  typescript/
    code-style.md      — Control flow patterns, braces, return statements
    conventions.md     — TypeScript-specific conventions (no-any, explicit returns, imports)
```

**For any AI tool used in this project:**
1. Read the relevant `.skills/<language>/` files before generating code
2. Ensure all suggestions comply with the rules defined there
3. The ESLint configuration (`eslint.config.mjs`) enforces these rules

**Supported tools:**
- **Copilot**: reads `.github/copilot-instructions.md` (thin wrapper pointing to `.skills/`)
- **Cursor**: can use `.cursorrules` (if configured) or read `.skills/` directly
- **Claude / other AI**: read the relevant `.skills/<language>/` files directly
