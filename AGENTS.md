# Repository Guidelines

## Project Structure & Module Organization
- `src/app`: Next App Router entry; `layout.tsx` defines the shell, `globals.css` sets base styles, and `page.tsx` renders the order form UI.
- `src/components`: Shared UI pieces (Button, Input, Select, Header, Footer) with co-located `*.module.css` styles.
- `public`: Static assets (e.g., favicon).  
- `out`: Generated static export output; regenerate via build rather than editing.
- Root configs: `next.config.ts`, `tsconfig.json` (path alias `@/*`), and `eslint.config.mjs`.

## Build, Test, and Development Commands
- `npm run dev`: Start the dev server at http://localhost:3000 with hot reload.
- `npm run build`: Production build; surfaces type and lint issues.
- `npm run start`: Serve the production build locally.
- `npm run lint`: Run ESLint with Next core-web-vitals + TypeScript rules.

## Coding Style & Naming Conventions
- TypeScript with `strict` enabled; keep props typed and prefer narrow unions for states and variants.
- Functional React components with hooks; add `'use client'` on interactive routes/components.
- CSS Modules for styling; keep class names descriptive and scoped to component intent.
- Use the `@/` alias for imports from `src`; group imports by lib/components/styles.
- Match surrounding indentation (components lean 4-space, `app` files lean 2-space); keep JSX compact and readable.

## Testing Guidelines
- No automated test suite is configured yet; always run `npm run lint` before pushing.
- When adding logic, include lightweight checks: document manual steps or add component tests (e.g., Jest/Vitest with React Testing Library) near the feature or under `src/__tests__`.

## Commit & Pull Request Guidelines
- Commit messages stay short and imperative as in history (e.g., `Add loading state to order form`); keep one concern per commit.
- PRs should link related issues/tasks, describe intent and approach, list commands run (`npm run lint`, `npm run build` when relevant), and attach screenshots or clips for UI changes.
