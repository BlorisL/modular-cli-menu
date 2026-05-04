# Contributing

Thanks for your interest in contributing to modular-cli-menu.

## Before You Start

- Read the README to understand the project structure and runtime behavior.
- Keep changes focused and minimal.
- Prefer small, reviewable pull requests.

## Development Workflow

1. Install dependencies with `npm ci`.
2. Make your changes.
3. Run the checks:
   - `npm run style:dry`
   - `npm test`
   - `npm run build`
4. If your change touches dependencies, regenerate the lockfile with the package manager and verify the CI checks.

## Code Style

- Follow the TypeScript conventions already used in the repository.
- Keep imports consistent with the existing `@/` alias for `src/` files.
- Avoid unrelated refactors in the same pull request.

## Pull Requests

- Explain what changed and why.
- Link to relevant issues when possible.
- Include screenshots or terminal output if the change affects user-facing behavior.
- Wait for CI to pass before requesting review.
