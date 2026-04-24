# TypeScript conventions

- No `any` (`@typescript-eslint/no-explicit-any: error`)
- All functions must have an explicit return type (`@typescript-eslint/explicit-function-return-type: error`)
- Use `@/` path alias instead of relative imports for files under `src/` (e.g. `import { Foo } from "@/components/foo"`)
