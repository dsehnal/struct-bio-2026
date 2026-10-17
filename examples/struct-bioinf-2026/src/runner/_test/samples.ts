/**
 * Copyright (c) 2026 mol* contributors, licensed under MIT, See LICENSE file for more info.
 *
 * Developed in collaboration with Anyfold <https://anyfold.ai/>
 *
 * @author David Sehnal <david.sehnal@gmail.com>
 */

import { runProgram } from '../runtime/core.js';
import type { Runner } from '../sandbox.js';

/** The smallest useful snippet (the one the typings are checked with). */
export const SAMPLE = `const s = builder
  .download({ url: 'https://www.ebi.ac.uk/pdbe/entry-files/download/1cbs.bcif' })
  .parse({ format: 'bcif' })
  .modelStructure();
s.component({ selector: 'polymer' }).representation({ type: 'cartoon' }).color({ color: 'teal' });
s.component({ selector: molql('resn REA') }).representation({ type: 'ball_and_stick' });
`;

/** A runner without the iframe: the sandbox's own runtime, in this process (the iframe is not tested here). */
export const inProcessRunner: Runner = {
  async run(program, options) {
    try {
      return { ok: true, data: await runProgram(program, { base: 'http://localhost:5181/', ...options }) };
    } catch (e) {
      const error = e instanceof Error ? e : new Error(String(e));
      return { ok: false, error: `${error.name}: ${error.message}`, stack: error.stack ?? '' };
    }
  },
};
