# Famerlo Games

## Project Overview
A monorepo of children's games published under the Famerlo brand. Currently contains Free Fruit Sudoku for Kids (web + mobile) and Arrow Puzzle (web).

## Current Status
- Branch: `main` (the `react-native-expo` branch was merged and retired 2026-11-21)
- Sudoku mobile app (React Native/Expo, SDK 58) is the primary product. iOS builds
  run on a Mac Mini build host. Version 1.0.0 (1) is on TestFlight (2026-11-21).
  The build and signing recipe is in famerlo-devman `docs/020 - Mac Mini Build Host.md`.
- Sudoku web app is production-ready (PWA, SEO, accessibility)
- Arrow Puzzle web app is in early development

## Architecture

### Monorepo Structure
```
ChildrensSudoku/
├── apps/
│   ├── sudoku-web/          # Sudoku React web app (Vite + Tailwind CSS + PWA)
│   ├── sudoku-mobile/       # Sudoku React Native app (Expo) — primary product
│   └── arrowpuzzle-web/     # Arrow Puzzle React web app (Vite)
├── packages/
│   ├── sudoku-core/         # Sudoku game logic (vanilla JS)
│   └── arrowpuzzle-core/    # Arrow Puzzle game logic (vanilla JS)
├── docs/                    # Shared documentation
├── scripts/                 # Asset generation scripts (Python)
└── package.json             # npm workspaces root
```

### Technology Stack
- **Web**: React + Vite (+ Tailwind CSS + PWA for Sudoku)
- **Mobile**: React Native + Expo (expo-av for sound, expo-haptics for haptics)
- **Shared**: Core game logic in vanilla JavaScript per game
- **Build**: npm workspaces
- **Package naming**: `@famerlo/<game>-core`, `@famerlo/<game>-web`, `@famerlo/<game>-mobile`

## Development Commands

### Sudoku
```bash
npm run dev:sudoku           # Start Sudoku web dev server (port 5191)
npm run build:sudoku         # Build Sudoku web app (static output in apps/sudoku-web/dist/)
npm run dev:sudoku-mobile    # Start Sudoku Expo dev server
```

### Arrow Puzzle
```bash
npm run dev:arrowpuzzle      # Start Arrow Puzzle dev server (port 5192)
npm run build:arrowpuzzle    # Build Arrow Puzzle web app
```

### General
```bash
npm install                  # Install all workspace dependencies
```

### Generate Assets (Sudoku)
```bash
python3 scripts/generate-icons.py        # Mobile app icons + splash
python3 scripts/generate-web-assets.py   # PWA icons + og-image
```

## Shared Documentation

See `docs/README.md` for a full index. Key documents:

- [Game Design Philosophy](docs/game-design-philosophy.md) — Core design principles all games must follow: stress-free gameplay, the error emoji system, no IAP, no timers, user-chosen difficulty, and advertising guidelines. **Read this before designing or modifying any game.**
- [Monorepo Layout](docs/monorepo-layout.md) — Directory structure, conventions, and rationale for how the repo is organized. Covers apps, packages, tools, puzzles, and docs directories.

## Important Notes
- Share business logic via `packages/<game>-core`, not UI components
- Each game's core package is pure vanilla JS — no platform dependencies
- Web builds are fully static — can be hosted anywhere
- Do not commit `screenshot-*.png` files (in .gitignore)

### Sudoku-specific
- Sudoku mobile is the primary product; web is secondary
- Game is fruit-themed only — no other emoji sets
- PWA service worker enables offline play
- Sudoku web is live at famerlo.com/free-fruit-sudoku-for-kids/
