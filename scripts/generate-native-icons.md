# Generate Native App Icons + Splash (iOS/Android)

Apple rejected the build because the app shipped with placeholder icons.

This project uses **Capacitor** and `@capacitor/assets` to generate all required icon sizes and a launch/splash screen.

## Source assets

- App icon: `src/assets/icon.png` (1024×1024)
- Splash/launch image: `src/assets/splash.png` (1920×1920)

## Run

After pulling latest code and installing dependencies:

```bash
npm install

# Generate iOS + Android icons + splashes into the native projects
npx capacitor-assets generate --iconBackgroundColor "#FFFFFF" --iconPath src/assets/icon.png --splashBackgroundColor "#FFFFFF" --splashPath src/assets/splash.png

# Then sync native projects
npx cap sync
```

## Verify in Xcode

1. `npx cap open ios`
2. In Xcode: **App Icons and Launch Images** → confirm the icon set is populated with your TidyWise icon.

## Notes

- Run the `capacitor-assets generate` step anytime you change `src/assets/icon.png` or `src/assets/splash.png`.
- This fixes App Store Review Guideline **2.3.8 (Accurate Metadata)** for placeholder icons.

## Important: Bundle ID

Apple also expects a real bundle identifier. Update it in your native project before archiving (e.g. `com.jointidywise.tidywise`).
