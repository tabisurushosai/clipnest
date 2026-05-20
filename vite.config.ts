import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { crx } from '@crxjs/vite-plugin';
import { defineConfig, type Plugin } from 'vite';
import manifest from './manifest.json';

function copyLegalDocsPlugin(): Plugin {
  return {
    name: 'copy-legal-docs',
    closeBundle() {
      const source = path.resolve(__dirname, 'legal');
      const target = path.resolve(__dirname, 'dist/legal');
      if (!fs.existsSync(source)) {
        return;
      }
      fs.cpSync(source, target, { recursive: true });
    },
  };
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [crx({ manifest }), copyLegalDocsPlugin()],
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        optionsTags: path.resolve(__dirname, 'src/options/tags.html'),
        optionsTemplates: path.resolve(__dirname, 'src/options/templates.html'),
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
