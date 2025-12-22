# EduFiliova Android App (Cordova)

This is the Cordova wrapper for the EduFiliova web application with push notifications, popup messages, and sounds.

## Prerequisites

1. **Node.js** (v16 or higher)
2. **Cordova CLI**: `npm install -g cordova`
3. **Android Studio** with:
   - Android SDK
   - Android SDK Build-Tools
   - Android SDK Platform-Tools
4. **Java JDK 11** or higher

## Setup

1. Navigate to the cordova-app directory:
   ```bash
   cd cordova-app
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Add Android platform:
   ```bash
   cordova platform add android
   ```

4. Install plugins:
   ```bash
   cordova plugin add cordova-plugin-whitelist
   cordova plugin add cordova-plugin-statusbar
   cordova plugin add cordova-plugin-splashscreen
   cordova plugin add cordova-plugin-inappbrowser
   cordova plugin add cordova-plugin-network-information
   ```

## Build Commands

### Debug Build (for testing)
```bash
cordova build android
```
Output: `platforms/android/app/build/outputs/apk/debug/app-debug.apk`

### Release Build (for Play Store)
```bash
cordova build android --release
```
Output: `platforms/android/app/build/outputs/apk/release/app-release-unsigned.apk`

## Run on Device/Emulator
```bash
cordova run android
```

## Icon Requirements

Place your app icons in the `res/icon/` folder with these sizes:

| Filename | Size | Android Density |
|----------|------|-----------------|
| android-ldpi.png | 36x36 | ldpi |
| android-mdpi.png | 48x48 | mdpi |
| android-hdpi.png | 72x72 | hdpi |
| android-xhdpi.png | 96x96 | xhdpi |
| android-xxhdpi.png | 144x144 | xxhdpi |
| android-xxxhdpi.png | 192x192 | xxxhdpi |

## Splash Screen Requirements

Place splash screens in `res/screen/` folder:

| Filename | Size | Orientation |
|----------|------|-------------|
| splash-port-ldpi.png | 200x320 | Portrait |
| splash-port-mdpi.png | 320x480 | Portrait |
| splash-port-hdpi.png | 480x800 | Portrait |
| splash-port-xhdpi.png | 720x1280 | Portrait |
| splash-land-ldpi.png | 320x200 | Landscape |
| splash-land-mdpi.png | 480x320 | Landscape |
| splash-land-hdpi.png | 800x480 | Landscape |
| splash-land-xhdpi.png | 1280x720 | Landscape |

## Signing for Play Store

1. Generate a keystore:
   ```bash
   keytool -genkey -v -keystore edufiliova.keystore -alias edufiliova -keyalg RSA -keysize 2048 -validity 10000
   ```

2. Create `build.json`:
   ```json
   {
     "android": {
       "release": {
         "keystore": "edufiliova.keystore",
         "storePassword": "YOUR_STORE_PASSWORD",
         "alias": "edufiliova",
         "password": "YOUR_KEY_PASSWORD"
       }
     }
   }
   ```

3. Build signed APK:
   ```bash
   cordova build android --release --buildConfig=build.json
   ```

## App Configuration

The app loads `https://edufiliova.com/app` which shows:
- GetStarted onboarding screen for new users
- Login/Signup flow
- Student Dashboard after login

## Push Notifications Setup

The app includes local notifications with popup messages and sounds.

### Plugins Installed:
- `cordova-plugin-local-notification` - Local notifications with sounds
- `cordova-plugin-push` - Firebase Cloud Messaging (FCM)
- `cordova-plugin-vibration` - Haptic feedback
- `cordova-plugin-badge` - Badge count on app icon

### Notification Sounds:
Place custom sound files in `res/raw/` folder:
- `notification_sound.mp3` - Default notification sound
- `lesson_sound.mp3` - Lesson reminders
- `achievement_sound.mp3` - Achievement unlocks
- `reminder_sound.mp3` - Study reminders

### Using Notifications from Web App:
```javascript
// The web app can trigger notifications via postMessage
window.parent.postMessage({
  type: 'notification',
  title: 'New Message',
  message: 'You have a new message from your teacher',
  notificationType: 'message'
}, '*');
```

### Firebase Setup (for remote push):
1. Create a Firebase project at https://console.firebase.google.com
2. Add Android app with package name `com.edufiliova.app`
3. Download `google-services.json` and place in the project root
4. Push notifications will work automatically

## Troubleshooting

**White screen on load:**
- Check internet connectivity
- Verify https://edufiliova.com/app is accessible

**Build errors:**
- Ensure Android SDK is properly configured
- Run `cordova requirements` to check dependencies

**Notifications not showing:**
- Ensure notification permissions are granted
- Check Android 13+ requires explicit permission request
- Verify notification channel is created
