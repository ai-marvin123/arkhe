import { defineConfig } from 'vite';
import type { UserConfig } from 'vite';
import type { InlineConfig } from 'vitest/node';
import react from '@vitejs/plugin-react';

interface VitestConfig extends UserConfig {
  test: InlineConfig;
}

export default defineConfig({
  plugins: [react()],
  base: './',
  test: {
    globals: true,
    environment: 'happy-dom',
  },
  build: {
    outDir: 'build',
    rollupOptions: {
      output: {
        entryFileNames: `assets/[name].js`,
        chunkFileNames: `assets/[name].js`,
        assetFileNames: `assets/[name].[ext]`,
      },
    },
  },
} as VitestConfig); // The "Magic" Type Cast);
