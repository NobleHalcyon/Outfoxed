# Outfoxed (Android Only)

Outfoxed is a local-only toddler learning game built with Expo + React Native + TypeScript.
It includes Focus mode, Progression mode, local kid profiles, adaptive practice, timer rounds, and optional memory mode with Nix the fox mascot.

## Requirements

- Node.js 20+
- Android Studio + Android SDK/emulator (or a connected Android device with USB debugging)
- Expo CLI (`npx expo ...` works without global install)
- Optional for APK builds: EAS account + `eas-cli`

## Install

```bash
npm install
```

## Run on Android (Dev Server)

```bash
npx expo start --android
```

Equivalent npm script:

```bash
npm run android:dev
```

## Run Native Android Build

```bash
npx expo run:android
```

Equivalent npm script:

```bash
npm run android:run
```

## Tests

```bash
npm test
```

## Kid Profiles

1. Open Home.
2. Tap `Add Kid` to create a profile.
3. Tap a profile chip to switch active kid.
4. Use `Rename Kid` and `Delete Kid` for profile management.

Each kid profile stores separate settings and learning stats locally via AsyncStorage.

## Branding Asset

Home screen logo is loaded from:

`assets/branding/outfoxed-logo.png`

If you replace the logo, keep the same path and filename.

## Required Android Assets

Configured in `app.json`:

- `assets/icon.png`
- `assets/adaptive-icon.png`
- `assets/splash.png`

## Build/Share APK (EAS Preview Profile)

Preview profile is configured in `eas.json` to output an installable APK (`buildType: apk`).

Build command:

```bash
npm run android:apk
```

Or directly:

```bash
eas build -p android --profile preview
```

After build:

1. Download the generated APK from the EAS build page.
2. Transfer it to the target Android phone.
3. On that phone, enable `Install unknown apps` for the app/file manager used to open the APK.
4. Open the APK and install.
