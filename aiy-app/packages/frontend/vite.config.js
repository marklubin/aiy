import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  root: '.', // Ensure this points to the right place
  build: {
    outDir: 'dist', // Where to output build files
    rollupOptions: {
      input: 'index.html', // Ensure this is correct
    },
  },
});