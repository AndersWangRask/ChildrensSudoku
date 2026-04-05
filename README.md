# Famerlo Games

Free, stress-free puzzle games for kids — by [Famerlo](https://famerlo.com), the AI assistant that helps busy parents manage family logistics.

## Philosophy

Every Famerlo Game follows the same principles:

- **Free forever** — no cost, no in-app purchases, no third-party ads
- **Stress-free** — no timers, no forced difficulty, no anxiety-inducing mechanics
- **Player chooses difficulty** — play easy puzzles all day if you want
- **Forgiving error system** — mistakes show an unhappy smiley that fades after 30 seconds; only five at once means game over
- **Every puzzle is solvable** — no impossible puzzles, no paid hints needed

See [Game Design Philosophy](docs/game-design-philosophy.md) for the full design guide.

## Games

### Free Fruit Sudoku for Kids
A fruit-emoji Sudoku game with three difficulty levels (4x4, 6x6, 9x9 grids). Available on web and mobile.

### Arrow Puzzle
A logic puzzle where you tap arrow tiles to slide them off the board. Clear the entire board to win. Currently in early development.

## Project Structure

```
FamerloGames/
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

## Documentation

See [docs/](docs/) for shared documentation, including the [Game Design Philosophy](docs/game-design-philosophy.md) and [Monorepo Layout](docs/monorepo-layout.md).
