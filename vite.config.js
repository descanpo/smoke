import { defineConfig, loadEnv, transformWithEsbuild } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// RN/Expo paketleri (.js içinde JSX taşıyan) production build'inde rollup'ın
// commonjs çözücüsü JSX'i ayrıştıramıyor. Bu plugin, ilgili node_modules
// dosyalarını commonjs'ten ÖNCE (enforce:'pre') esbuild ile JSX olarak
// dönüştürür; böylece downstream yalnızca düz JS görür.
const RN_JSX_IN_JS = /node_modules[\\/](@expo[\\/]vector-icons|react-native-vector-icons)[\\/].*\.js$/;
function rnJsxInJsPlugin() {
  return {
    name: 'rn-jsx-in-js',
    enforce: 'pre',
    async transform(code, id) {
      if (RN_JSX_IN_JS.test(id)) {
        return transformWithEsbuild(code, id, { loader: 'jsx', jsx: 'transform' });
      }
      return null;
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [rnJsxInJsPlugin(), react()],
    envPrefix: ['VITE_', 'EXPO_PUBLIC_'],
    resolve: {
      alias: {
        // @react-native/assets-registry/registry Flow sözdizimi taşır ve
        // esbuild/rollup altında ayrıştırılamaz; Flow'suz shim'e yönlendir.
        '@react-native/assets-registry/registry': path.resolve(__dirname, 'shims/assets-registry.js'),
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
      // Bağımlılık ön-paketlemesinde de .js dosyalarını JSX olarak çöz.
      esbuildOptions: {
        loader: { '.js': 'jsx' },
        resolveExtensions: ['.web.js', '.web.ts', '.web.tsx', '.js', '.ts', '.tsx', '.jsx'],
      },
    },
    server: {
      port: 3000,
      open: true,
    },
  };
});
