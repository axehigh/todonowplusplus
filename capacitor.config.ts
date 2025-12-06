import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.antigravity.todo',
  appName: 'todo-app',
  webDir: 'dist',
  // Configure @capacitor/assets using the top-level `assets` field
  assets: {
    android: {
      adaptiveIconForeground: 'resources/icon.png',
      adaptiveIconBackgroundColor: '#FFFFFF',
      notificationIcon: 'resources/icon.png'
    },
    ios: {
      appIcon: 'resources/icon.png'
    }
  }
};

export default config;
