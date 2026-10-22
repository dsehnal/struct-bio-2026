/**
 * Copyright (c) 2026 mol* contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author David Sehnal <david.sehnal@gmail.com>
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { HOST_TIMEOUT_MS, withTimeout } from '../host.js';
import { createTmAlign, type FileLoader } from '../tm-align.js';

// The page's half of tmAlign on local files (never the network): a structure against a moved copy of itself must give back
// that motion. The files are the repository's data/examples: crambin as text, and 1CBS as BinaryCIF.

const examples = resolve(import.meta.dirname, '../../../../../data/examples');
const crambin = readFileSync(resolve(examples, '1crn.cif'), 'utf8');
const cbs = new Uint8Array(readFileSync(resolve(examples, '1cbs_full.bcif')));

/** A rotation about z by `angle` and a shift, applied to each ATOM and HETATM line of an mmCIF text. */
function moved(text: string, angle: number, shift: [number, number, number]): string {
  const lines = text.split('\n');
  const names = lines.filter((l) => l.startsWith('_atom_site.')).map((l) => l.trim());
  const [x, y, z] = ['Cartn_x', 'Cartn_y', 'Cartn_z'].map((c) => names.indexOf(`_atom_site.${c}`));
  const [c, s] = [Math.cos(angle), Math.sin(angle)];
  return lines
    .map((line) => {
      if (!/^(ATOM|HETATM)\s/.test(line)) return line;
      const f = line.trim().split(/\s+/);
      const [px, py, pz] = [Number(f[x]), Number(f[y]), Number(f[z])];
      f[x] = (c * px - s * py + shift[0]).toFixed(3);
      f[y] = (s * px + c * py + shift[1]).toFixed(3);
      f[z] = (pz + shift[2]).toFixed(3);
      return f.join(' ');
    })
    .join('\n');
}

/** Column-major 4×4 times a point. */
function apply(m: number[], p: [number, number, number]): [number, number, number] {
  return [0, 1, 2].map((i) => m[i] * p[0] + m[4 + i] * p[1] + m[8 + i] * p[2] + m[12 + i]) as [number, number, number];
}

function loaderOf(files: Record<string, string | Uint8Array>) {
  const load = vi.fn<FileLoader>(async (url) => {
    const found = files[url];
    if (found === undefined) throw new Error(`Could not download ${url} (HTTP 404).`);
    return found;
  });
  return load;
}

describe('tmAlign on the page', () => {
  const angle = 0.9;
  const shift: [number, number, number] = [12, -7, 30];
  const load = loaderOf({ 'https://x.test/a.cif': crambin, 'https://x.test/b.cif': moved(crambin, angle, shift) });
  const align = createTmAlign(load);
  const reference = { url: 'https://x.test/a.cif', format: 'mmcif', chain: 'A' } as const;
  const mobile = { url: 'https://x.test/b.cif', format: 'mmcif' } as const;

  it('gives back the motion of a rotated and shifted copy, and a TM-score of 1', async () => {
    const fit = await align({ reference, mobile });
    expect(fit.matrix).toHaveLength(16);
    expect(fit.tmScore).toBeGreaterThan(0.99);
    expect(fit.rmsd).toBeLessThan(0.01);
    expect(fit.alignedLength).toBe(46);
    // The matrix undoes the motion: a point of the copy goes back to the point it was made from.
    const [c, s] = [Math.cos(angle), Math.sin(angle)];
    for (const p of [
      [3, 4, 5],
      [-10, 8, 2],
      [0, 0, 0],
    ] as [number, number, number][]) {
      const made: [number, number, number] = [
        c * p[0] - s * p[1] + shift[0],
        s * p[0] + c * p[1] + shift[1],
        p[2] + shift[2],
      ];
      const back = apply(fit.matrix, made);
      back.forEach((v, i) => expect(v).toBeCloseTo(p[i], 1));
    }
  });

  it('reads BinaryCIF, and an identical structure needs no motion', async () => {
    const same = { url: 'https://x.test/c.bcif', format: 'bcif' } as const;
    const fit = await createTmAlign(loaderOf({ [same.url]: cbs }))({ reference: same, mobile: same });
    expect(fit.tmScore).toBeGreaterThan(0.99);
    expect(fit.rmsd).toBeLessThan(0.01);
    const identity = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
    fit.matrix.forEach((v, i) => expect(v).toBeCloseTo(identity[i], 2));
  });

  it('remembers a file and an answer: a second call downloads nothing', async () => {
    const files = loaderOf({ 'https://x.test/a.cif': crambin, 'https://x.test/b.cif': crambin });
    const once = createTmAlign(files);
    const first = await once({ reference, mobile });
    await once({ reference, mobile });
    expect(files).toHaveBeenCalledTimes(2);
    // Another chain choice is a new answer over the same two files.
    await once({ reference, mobile: { ...mobile, chain: 'A' } });
    expect(files).toHaveBeenCalledTimes(2);
    expect(first.alignedLength).toBe(46);
  });

  it('does not remember a failure', async () => {
    const files = loaderOf({});
    const once = createTmAlign(files);
    await expect(once({ reference, mobile })).rejects.toThrow(/Could not download/);
    await expect(once({ reference, mobile })).rejects.toThrow(/Could not download/);
    expect(files.mock.calls.length).toBeGreaterThan(2);
  });

  it('says which chain is missing, and which there are', async () => {
    await expect(align({ reference: { ...reference, chain: 'Z' }, mobile })).rejects.toThrow(
      /no polymer chain "Z" \(its polymer chains: A\)/,
    );
  });

  it('refuses a file that is not a structure', async () => {
    const bad = createTmAlign(
      loaderOf({ 'https://x.test/a.cif': 'this is not a cif file', 'https://x.test/b.cif': crambin }),
    );
    await expect(bad({ reference, mobile })).rejects.toThrow(/Mol\* can read|holds no data|no polymer/);
  });
});

describe('withTimeout', () => {
  it('passes the answer, or fails with the message when the time is over', async () => {
    vi.useFakeTimers();
    try {
      expect(HOST_TIMEOUT_MS).toBe(60_000);
      await expect(withTimeout(Promise.resolve(3), 1000, 'late')).resolves.toBe(3);
      const slow = withTimeout(new Promise(() => {}), 1000, 'late');
      const check = expect(slow).rejects.toThrow('late');
      await vi.advanceTimersByTimeAsync(1001);
      await check;
    } finally {
      vi.useRealTimers();
    }
  });
});
