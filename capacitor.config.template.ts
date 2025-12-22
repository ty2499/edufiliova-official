import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.edufiliova.app',
  appName: 'EduFiliova',
  webDir: 'dist/public',
  
  server: {
    url: 'https://app.edufiliova.com',
    cleartext: false,
    androidScheme: 'https'
  },
  
  android: {
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false,
    backgroundColor: '#ffffff'
  },
  
  ios: {
    contentInset: 'automatic',
    allowsLinkPreview: true,
    scrollEnabled: true,
    backgroundColor: '#ffffff'
  },
  
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#ffffff',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#d44472'
    },
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true
    }
  }
};

export default config;
