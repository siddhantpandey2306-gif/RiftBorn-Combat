import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
  // Use relative base path so assets resolve properly on GitHub Pages (https://<user>.github.io/<repo>/)
  base: './',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false, // Security: Never publish internal source maps in production
    minify: true,
  },
});
