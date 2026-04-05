# Free Fruit Sudoku for Kids

## Project Overview
A children's Sudoku game using fruit emojis, built for both web and mobile platforms. The mobile version is the primary product; the web version is maintained alongside it.

## Current Status
- Branch: `react-native-expo`
- Mobile app (React Native/Expo) is the primary target
- Web app (React + Vite) is maintained in parallel
- Web app is production-ready (PWA, SEO, accessibility)

## Architecture

### Monorepo Structure
```
ChildrensSudoku/
├── apps/
│   ├── web/          # React web app (Vite + Tailwind CSS + PWA)
│   └── mobile/       # React Native app (Expo) — primary product
├── packages/
│   └── core/         # Shared game logic (vanilla JS)
├── scripts/          # Asset generation scripts (Python)
└── package.json      # npm workspaces root
```

### Technology Stack
- **Web**: React + Vite + Tailwind CSS + vite-plugin-pwa
- **Mobile**: React Native + Expo (expo-av for sound, expo-haptics for haptics)
- **Shared**: Core game logic in vanilla JavaScript
- **Build**: npm workspaces

## Completed Phases

### ✅ Phase 1: Monorepo Setup
- [x] Create branch for React Native development
- [x] Move web app to `apps/web/`
- [x] Extract game logic to `packages/core/`
- [x] Update import paths in web app
- [x] Test web app still works

### ✅ Phase 2: React Native App
- [x] Initialize Expo app in `apps/mobile/`
- [x] Import shared game logic
- [x] Convert UI components to React Native
- [x] Implement touch interactions
- [x] Style with React Native StyleSheet

### ✅ Step 1: Rebrand to "Free Fruit Sudoku for Kids"
- [x] Rename game throughout all UI text, titles, and metadata
- [x] Strip all non-fruit emoji sets from `packages/core/src/gameLogic.js`
- [x] Remove theme selection logic (game is always fruit-themed)
- [x] Update mobile `app.json` with new name
- [x] Update `README.md`

### ✅ Step 2: Tidy Up / Housekeeping
- [x] Configure proper npm workspaces in root `package.json`
- [x] Fix mobile app's fragile relative import to use workspace package reference
- [x] Clean up unused files

### ✅ Step 3: Feature Enhancement
- [x] Sound effects (Web Audio API for web, expo-av for mobile)
- [x] Haptic feedback (mobile only, expo-haptics)
- [x] Fruit-themed favicon, app icons, and splash screen
- [x] Responsive board and emoji sizing
- [x] Fruit button checkmarks when all positions filled
- [x] Timed error emoji system (30s expiry, 5 = game over)
- [x] "How to play" overlay with rules and interface guide
- [x] Famerlo advertisement footer

### ✅ Step 4: Production Readiness
- [x] SEO meta tags (description, Open Graph, Twitter Card)
- [x] Social preview image (og-image.png)
- [x] PWA support (service worker, web manifest, offline play, installable)
- [x] PWA icons (192x192, 512x512) and apple-touch-icon
- [x] Accessibility (ARIA labels, keyboard support, aria-live status)
- [x] Fruit deselect (tap selected fruit to deselect)
- [x] Friendly game over/win with "Try Again" / "Play Again" buttons
- [x] Hint feature on Easy mode (highlights a cell for 2 seconds)
- [x] Section completion flash animation
- [x] Cleanup of test artifacts, updated .gitignore
- [ ] Test on iOS and Android devices

### 📋 Phase 5: Future Learning Goals (Deferred)
- [ ] Camera integration (avatar photos)
- [ ] Microphone (voice commands)
- [ ] Location services (local leaderboards)
- [ ] Background audio playback

## Development Commands

### Web Development
```bash
npm run dev:web        # Start web dev server (port 5191)
npm run build:web      # Build web app (static output in apps/web/dist/)
```

### Mobile Development
```bash
npm run dev:mobile     # Start Expo dev server
# Use Expo Go app on phone to test
```

### Install Dependencies
```bash
npm install            # Install all workspace dependencies
```

### Generate Assets
```bash
python3 scripts/generate-icons.py        # Mobile app icons + splash
python3 scripts/generate-web-assets.py   # PWA icons + og-image
```

## Shared Documentation

See `docs/README.md` for a full index. Key documents:

- [Monorepo Layout](docs/monorepo-layout.md) — Directory structure, conventions, and rationale for how the repo is organized. Covers apps, packages, tools, puzzles, and docs directories.

## Important Notes
- Mobile is the primary product; web is secondary
- Keep both apps functional throughout all changes
- Share business logic via `packages/core`, not UI components
- Game is fruit-themed only — no other emoji sets
- Web build is fully static — can be hosted anywhere
- PWA service worker enables offline play
- Test on real devices early and often
- Do not commit `screenshot-*.png` files (in .gitignore)
