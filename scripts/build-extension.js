import { build } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';

async function runBuild() {
  console.log('🚀 [1/3] Building Popup and Dashboard (React SPAs)...');
  await build({
    configFile: false,
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve('./src')
      }
    },
    build: {
      outDir: 'dist',
      emptyOutDir: true,
      rollupOptions: {
        input: {
          popup: path.resolve('popup.html'),
          dashboard: path.resolve('dashboard.html')
        }
      }
    }
  });

  console.log('⚡ [2/3] Building Background Service Worker (ES Module)...');
  await build({
    configFile: false,
    resolve: {
      alias: {
        '@': path.resolve('./src')
      }
    },
    build: {
      outDir: 'dist',
      emptyOutDir: false,
      lib: {
        entry: path.resolve('src/background/index.ts'),
        formats: ['es'],
        fileName: () => 'background.js'
      }
    }
  });

  console.log('🛡️ [3/3] Building Content Script (Standalone Bundle)...');
  await build({
    configFile: false,
    resolve: {
      alias: {
        '@': path.resolve('./src')
      }
    },
    build: {
      outDir: 'dist',
      emptyOutDir: false,
      lib: {
        entry: path.resolve('src/content/index.ts'),
        name: 'SecretSanitizerContent',
        formats: ['iife'],
        fileName: () => 'content.js'
      }
    }
  });

  // Ensure manifest.json and icons are in dist
  const manifestDist = path.resolve('dist/manifest.json');
  if (!fs.existsSync(manifestDist)) {
    fs.copyFileSync(path.resolve('public/manifest.json'), manifestDist);
  }

  const iconsSrcDir = path.resolve('public/icons');
  const iconsDistDir = path.resolve('dist/icons');
  if (!fs.existsSync(iconsDistDir)) {
    fs.mkdirSync(iconsDistDir, { recursive: true });
  }

  fs.readdirSync(iconsSrcDir).forEach((file) => {
    fs.copyFileSync(path.join(iconsSrcDir, file), path.join(iconsDistDir, file));
  });

  console.log('✅ Chrome Extension build complete! Directory: dist/');
}

runBuild().catch((err) => {
  console.error('Build failed:', err);
  process.exit(1);
});
