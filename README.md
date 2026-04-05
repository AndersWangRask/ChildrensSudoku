# Famerlo Games

A monorepo of fun children's games by Famerlo.

## Games

### Free Fruit Sudoku for Kids
A fruit-emoji Sudoku game with multiple difficulty levels (4x4, 6x6, 9x9 grids). Available on web and mobile.

### Arrow Puzzle
A logic puzzle where you tap arrow tiles to slide them off the board. Clear the entire board to advance through increasingly challenging levels.

## Project Structure

```
ChildrensSudoku/
├── apps/
│   ├── sudoku-web/          # Sudoku web app (React + Vite)
│   ├── sudoku-mobile/       # Sudoku mobile app (React Native + Expo)
│   └── arrowpuzzle-web/     # Arrow Puzzle web app (React + Vite)
├── packages/
│   ├── sudoku-core/         # Sudoku game logic
│   └── arrowpuzzle-core/    # Arrow Puzzle game logic
├── docs/                    # Shared documentation
├── scripts/                 # Asset generation scripts
└── package.json             # npm workspaces root
```

## Quick Start

### Install all dependencies

```bash
npm install
```

### Sudoku (Web)

```bash
npm run dev:sudoku
```

Visit http://localhost:5191/free-fruit-sudoku-for-kids/

### Sudoku (Mobile)

```bash
npm run dev:sudoku-mobile
```

Use Expo Go app to scan QR code.

### Arrow Puzzle (Web)

```bash
npm run dev:arrowpuzzle
```

Visit http://localhost:5192

## Technology Stack

- **Web**: React + Vite
- **Mobile**: React Native + Expo
- **Shared Logic**: Vanilla JavaScript per game in `packages/`
- **Build**: npm workspaces
