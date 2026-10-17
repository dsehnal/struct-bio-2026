/**
 * Copyright (c) 2026 mol* contributors, licensed under MIT, See LICENSE file for more info.
 *
 * Developed in collaboration with Anyfold <https://anyfold.ai/>
 *
 * @author David Sehnal <david.sehnal@gmail.com>
 */

import { defaultClientConditions, defineConfig } from 'vite';

// Workspace packages resolve to their sources through the `molstar-src` export condition (as in the tests and the other
// builds), so no package needs to be built first. `base: './'` makes the build relative, so the `build/` folder can be
// served from any sub-path (GitHub Pages: https://<org>.github.io/<repo>/), _spec/README.md decision 9.
export default defineConfig({
  base: './',
  resolve: { conditions: ['molstar-src', ...defaultClientConditions] },
  build: {
    outDir: 'build',
    emptyOutDir: true,
    target: 'es2022',
    sourcemap: false,
  },
});
