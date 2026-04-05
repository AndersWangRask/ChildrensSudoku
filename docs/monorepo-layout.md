# Monorepo Layout

This repository is a monorepo containing multiple children's games published under the Famerlo brand. All games share common branding, UI patterns, and infrastructure while keeping game-specific logic separate.

## Directory Structure

```
FamerloGames/
├── apps/                       # Deployable applications
│   ├── sudoku-web/             # Web app (React + Vite + Tailwind CSS + PWA)
│   ├── sudoku-mobile/          # Mobile app (React Native + Expo)
│   ├── <game>-web/             # Pattern: one web app per game
│   └── <game>-mobile/          # Pattern: one mobile app per game
│
├── packages/                   # Shared JavaScript/TypeScript packages (npm workspaces)
│   ├── sudoku-core/            # Sudoku game logic (vanilla JS)
│   ├── <game>-core/            # Pattern: one core logic package per game
│   ├── shared-ui-web/          # Shared React components (Famerlo footer, About overlay)
│   ├── shared-ui-mobile/       # Shared React Native components
│   └── shared-config/          # Common branding, colors, metadata
│
├── tools/                      # Offline tooling (level designers, generators)
│   ├── <game>-designer/        # Pattern: Rust CLI that generates/validates puzzles
│   └── ...                     # Each tool has its own Cargo.toml and README
│
├── puzzles/                    # Pre-generated puzzle data (output from tools/)
│   └── <game>/                 # Pattern: one directory per game
│       ├── easy/               # Organized by difficulty
│       ├── medium/
│       └── hard/
│
├── docs/                       # Shared documentation (this directory)
│   └── README.md               # Index of all shared docs
│
├── scripts/                    # Build and asset generation scripts (Python, shell)
│
├── CLAUDE.md                   # Agent instructions and project context
├── README.md                   # Public-facing project overview
└── package.json                # npm workspaces root
```

## Conventions

### Apps (`apps/`)

Each game has up to two deployable apps: a web version and a mobile version. Both are independently buildable and deployable.

- **Web apps** use React + Vite + Tailwind CSS, built as static sites with PWA support.
- **Mobile apps** use React Native + Expo, built via EAS for App Store and Play Store.
- App names follow the pattern `<game>-web` and `<game>-mobile`.
- Each app has its own `package.json` and can have a `docs/` subdirectory for app-specific documentation if needed.

### Packages (`packages/`)

Shared JavaScript code distributed via npm workspaces. Game logic is kept in vanilla JS so it can be consumed by both web and mobile apps without platform-specific dependencies.

- **`<game>-core`** — Pure game logic: puzzle generation, validation, state management. No UI code. No platform dependencies.
- **`shared-ui-web`** — Shared React components for web apps (Famerlo footer, About overlay, How to Play pattern).
- **`shared-ui-mobile`** — Shared React Native components for mobile apps (same features, native implementation).
- **`shared-config`** — Brand colors, shared constants, metadata templates.

### Tools (`tools/`)

Offline tools for generating and validating puzzle content. These are independent from the JavaScript ecosystem.

- Typically written in Rust for performance (brute-force puzzle generation and solver validation).
- Each tool has its own `Cargo.toml`, build instructions, and `README.md`.
- Output goes to `puzzles/` — tools produce data, apps consume it.
- Not part of the npm workspace.

### Puzzles (`puzzles/`)

Pre-generated puzzle data, checked into git. Produced by tools in `tools/`, consumed by core packages in `packages/`.

- Stored as JSON files, organized by game and difficulty level.
- Core packages import puzzle data at build time and expose an API like `getRandomPuzzle(difficulty)`.
- Not all games need this — games with runtime puzzle generation (like Sudoku) don't use this directory.

### Docs (`docs/`)

Shared documentation that applies across the entire monorepo. See `docs/README.md` for an index of all docs.

App-specific or tool-specific documentation lives alongside the code it describes (e.g., `apps/sudoku-web/docs/` or `tools/ballsort-designer/README.md`).

## What Goes Where

| I need to... | Put it in... |
|---|---|
| Add a new game | `apps/<game>-web/`, `apps/<game>-mobile/`, `packages/<game>-core/` |
| Add shared UI (web) | `packages/shared-ui-web/` |
| Add shared UI (mobile) | `packages/shared-ui-mobile/` |
| Add a level designer | `tools/<game>-designer/` |
| Store generated puzzles | `puzzles/<game>/` |
| Write repo-wide docs | `docs/` |
| Write app-specific docs | `apps/<app>/docs/` |
| Add a build/asset script | `scripts/` |
