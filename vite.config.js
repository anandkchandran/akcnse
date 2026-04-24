import { defineConfig, transformWithEsbuild } from 'vite';
import react from '@vitejs/plugin-react';

// Vite only enables the JSX parser for .jsx/.tsx by default.
// This plugin tells esbuild to treat any .js file inside src/ as JSX too,
// so App.js and similar legacy-named files don't need to be renamed.
const treatSrcJsAsJsx = {
  name: 'treat-src-js-as-jsx',
  async transform(code, id) {
    if (!id.includes('/src/') || !id.endsWith('.js')) return null;
    return transformWithEsbuild(code, id, { loader: 'jsx', jsx: 'automatic' });
  },
};

export default defineConfig(({ command }) => ({
  plugins: [treatSrcJsAsJsx, react()],

  // `command` is 'build' for `vite build` and 'serve' for `vite` (dev server).
  // Vite resolves config *before* setting NODE_ENV=production, so checking
  // `command` is the only reliable way to detect a production build here.
  // GH Pages subfolder on build; root path on local dev.
  base: command === 'build'
    ? (process.env.VITE_BASE_PATH || '/akcnse/')
    : '/',

  server: {
    port: 4001,
    // Proxy API requests to the backend server so the browser never touches
    // Yahoo Finance / Claude / Gemini directly — avoids CORS issues.
    proxy: {
      '/api': {
        target:       'http://localhost:4001',
        changeOrigin: true,
      },
    },
  },

  preview: {
    port: 4000,
  },

  // Don't copy the legacy CRA public/ folder (fonts/CSS are CDN-linked in index.html)
  publicDir: false,

  build: {
    outDir:     'build',
    sourcemap:   false,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom'],
        },
      },
    },
  },
}));
