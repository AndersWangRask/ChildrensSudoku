# Children's Sudoku - Mobile App

This is the React Native/Expo version of the Children's Sudoku game.

## Prerequisites

- Node.js (v18 or higher)
- Expo Go app on your phone (iOS/Android)
- Or iOS Simulator (Mac only) / Android Emulator

## Installation

```bash
npm install --no-bin-links
```

## Running the App

### On Physical Device

1. Start the Expo development server:
   ```bash
   npx expo start
   ```

2. Scan the QR code with:
   - iOS: Camera app
   - Android: Expo Go app

### On Simulator/Emulator

```bash
# iOS (Mac only)
npx expo start --ios

# Android
npx expo start --android
```

## Features

- 🎮 Same game logic as web version
- 📱 Touch-optimized interface
- 🎨 Native React Native components
- 📏 Responsive design for different screen sizes
- 🏆 Error tracking and completion alerts

## Project Structure

```
mobile/
├── App.js              # Main app component
├── app.json           # Expo configuration
├── babel.config.js    # Babel configuration
├── package.json       # Dependencies
└── assets/           # Icons and images
```

## Shared Code

This app shares game logic with the web version through the `packages/core` module, demonstrating effective code reuse across platforms.