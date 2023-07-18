import commonjs from '@rollup/plugin-commonjs';
import react from '@vitejs/plugin-react';
import nodePolyfills from 'rollup-plugin-polyfill-node';
import { defineConfig } from 'vite';
import topLevelAwait from "vite-plugin-top-level-await";
import wasm from "vite-plugin-wasm";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    wasm(),
    react(),
    topLevelAwait()
  ],

  define: {
    'process.env': {
      npm_config_arch: "x64",
    },
    'process.versions.modules': {},
  },

  build: {
    // minify: false,

    rollupOptions: {
      plugins: [
        nodePolyfills(),
        commonjs(),
      ],
    },
  },
})
