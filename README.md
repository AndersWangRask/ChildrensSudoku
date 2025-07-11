# Children's Sudoku - Monorepo

A fun emoji-based Sudoku game for children, available on both web and mobile platforms.

## 🎮 Game Features

- Multiple difficulty levels (4x4, 6x6, 9x9 grids)
- Various emoji themes (animals, fruits, vehicles, etc.)
- Visual feedback for correct/incorrect moves
- Error tracking
- Responsive design

## 📁 Project Structure

This is a monorepo containing:

```
ChildrensSudoku/
├── apps/
│   ├── web/          # React web app (Vite)
│   └── mobile/       # React Native app (Expo)
├── packages/
│   └── core/         # Shared game logic
├── CLAUDE.md         # Development plan and progress
└── MIGRATION_PLAN.md # Technical migration details
```

## 🚀 Quick Start

### Web App

```bash
cd apps/web
npm install --no-bin-links
npm run dev
```

Visit http://localhost:5173

### Mobile App

```bash
cd apps/mobile
npm install --no-bin-links
npx expo start
```

Use Expo Go app to scan QR code

## 🛠️ Development

This project uses:
- **Web**: React + Vite + Tailwind CSS
- **Mobile**: React Native + Expo
- **Shared Logic**: Vanilla JavaScript modules

## 📖 Documentation

- [CLAUDE.md](./CLAUDE.md) - Development roadmap and learning objectives
- [MIGRATION_PLAN.md](./MIGRATION_PLAN.md) - Technical migration details
- [CROSS_PLATFORM_DEVELOPMENT.md](./CROSS_PLATFORM_DEVELOPMENT.md) - VMware HGFS setup guide
