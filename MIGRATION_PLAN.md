# React Native Migration Plan

## Current Structure
- Single React web app using Vite
- All game logic mixed with UI components

## Target Structure
```
ChildrensSudoku/
├── apps/
│   ├── web/          # Current React web app
│   └── mobile/       # New React Native/Expo app
├── packages/
│   └── core/         # Shared game logic
└── package.json      # Root workspace config
```

## Migration Steps

### Phase 1: Reorganize into Monorepo (Current)
1. Move existing web app to `apps/web/`
2. Extract game logic to `packages/core/`
3. Set up workspace configuration

### Phase 2: Add React Native App
1. Create Expo app in `apps/mobile/`
2. Import shared game logic from `packages/core/`
3. Implement React Native UI components

### Phase 3: Feature Parity
1. Ensure mobile app matches web functionality
2. Add mobile-specific optimizations
3. Test on iOS and Android devices

### Benefits
- Shared game logic between platforms
- Independent UI implementations
- Easy to maintain and scale
- Learn modern monorepo practices