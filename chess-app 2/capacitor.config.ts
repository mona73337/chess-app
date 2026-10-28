import type { CapacitorConfig } from '@capacitor/cli';

// Wraps the built web app (dist/) as an Android app.
const config: CapacitorConfig = {
  appId: 'io.github.mona73337.chess',
  appName: 'Chess',
  webDir: 'dist',
  backgroundColor: '#dde4e7',
};

export default config;
