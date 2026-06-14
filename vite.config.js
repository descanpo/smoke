import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react()],
    envPrefix: ['VITE_', 'EXPO_PUBLIC_'],
    resolve: {
      alias: {
        'react-native': 'react-native-web',
      },
      extensions: [
        '.web.tsx', '.web.ts', '.web.jsx', '.web.js',
        '.tsx', '.ts', '.jsx', '.js',
      ],
    },
    define: {
      global: 'window',
      __DEV__: JSON.stringify(true),
      'process.env.EXPO_PUBLIC_SUPABASE_URL': JSON.stringify(
        env.EXPO_PUBLIC_SUPABASE_URL || 'https://yvuvmpyqunzpnicwjscg.supabase.co'
      ),
      'process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY': JSON.stringify(
        env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl2dXZtcHlxdW56cG5pY3dqc2NnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE0NDUxNDQsImV4cCI6MjA5NzAyMTE0NH0.1lencj0qZR7qdBkW7sGys-L3W1lTWRX5Nd_uJlTLAGc'
      ),
    },
    optimizeDeps: {
      entries: ['index.html'],
    },
    server: {
      port: 3000,
      open: true,
    },
  };
});
