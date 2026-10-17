/**
 * Copyright (c) 2026 mol* contributors, licensed under MIT, See LICENSE file for more info.
 *
 * Developed in collaboration with Anyfold <https://anyfold.ai/>
 *
 * @author David Sehnal <david.sehnal@gmail.com>
 */

import { describe, expect, it } from 'vitest';
import { sourceLines, transpile } from '../transpile.js';

describe('transpile', () => {
  it('erases types', async () => {
    const r = await transpile('const n: number = 1;\nconst s = `a${n}` as string;\n');
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.js).not.toMatch(/number|string/);
    expect(r.js).toContain('const n = 1;');
  });

  it('maps lines back when erasing types removes lines', async () => {
    const code = ['interface P {', '  x: number;', '}', 'type Q = P;', 'const a = 1;', 'throw new Error("here");'].join(
      '\n',
    );
    const r = await transpile(code);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const js = r.js.split('\n');
    expect(js.length).toBeLessThan(code.split('\n').length);
    expect(r.lines[js.findIndex((l) => l.includes('const a'))]).toBe(5);
    expect(r.lines[js.findIndex((l) => l.includes('throw'))]).toBe(6);
  });

  it('reports a syntax error with its line', async () => {
    const r = await transpile('const a = 1;\nconst b = (2;\n');
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.problems[0].line).toBe(2);
    expect(r.problems[0].message).not.toBe('');
  });

  it('rejects import and export, at their lines', async () => {
    const r = await transpile('const a = 1;\nimport { x } from "y";\n');
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.problems[0].line).toBe(2);
    expect(r.problems[0].message).toMatch(/import and export/);
  });

  it('drops the module marker TypeScript adds', async () => {
    const r = await transpile('const a = 1;\nexport {};\n');
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.js).not.toMatch(/export/);
  });
});

describe('sourceLines', () => {
  it('decodes the first source line of each generated line', () => {
    // Three generated lines: 0 -> source line 1; the second has no mapping; 2 -> source line 3 (delta +2).
    expect(sourceLines('AAAA;;AAEA')).toEqual([1, 0, 3]);
  });

  it('follows negative deltas', () => {
    // 0 -> source line 4 (delta +3), then back by 2 (delta -2, encoded as D) to line 2.
    expect(sourceLines('AAGA;AADA')).toEqual([4, 3]);
  });
});
