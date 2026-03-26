# Free Fruit Sudoku for Kids

A fun fruit-emoji Sudoku game for children, available on both web and mobile platforms.

## Game Features

- Multiple difficulty levels (4x4, 6x6, 9x9 grids)
- Fruit emoji theme
- Visual feedback for correct/incorrect moves
- Error tracking
- Responsive design

## Project Structure

This is a monorepo containing:

```
ChildrensSudoku/
├── apps/
│   ├── web/          # React web app (Vite)
│   └── mobile/       # React Native app (Expo) — primary product
├── packages/
│   └── core/         # Shared game logic
└── package.json      # npm workspaces root
```

## Quick Start

### Install all dependencies

```bash
npm install
```

### Web App

```bash
npm run dev:web
```

Visit http://localhost:5191

### Mobile App

```bash
npm run dev:mobile
```

Use Expo Go app to scan QR code.

## Technology Stack

- **Web**: React + Vite + Tailwind CSS
- **Mobile**: React Native + Expo
- **Shared Logic**: Vanilla JavaScript modules in `packages/core`
