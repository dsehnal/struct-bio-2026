/**
 * Copyright (c) 2026 mol* contributors, licensed under MIT, See LICENSE file for more info.
 *
 * Developed in collaboration with Anyfold <https://anyfold.ai/>
 *
 * @author David Sehnal <david.sehnal@gmail.com>
 */

import { describe, expect, it, vi } from 'vitest';
import type { HostCalls, TmAlignResult } from '../host.js';
import { runSnippetWith, runSvsSnippetWith } from '../run.js';
import { inProcessRunner, SAMPLE } from './samples.js';

const run = (code: string) => runSnippetWith(inProcessRunner, code);

describe('runSnippet (the sandbox runtime in process)', () => {
  it('builds the sample as single-state MVS data', async () => {
    const r = await run(SAMPLE);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.mvs.kind ?? 'single').toBe('single');
    const kinds: string[] = [];
    const visit = (node: { kind: string; children?: unknown[] }) => {
      kinds.push(node.kind);
      for (const child of node.children ?? []) visit(child as { kind: string; children?: unknown[] });
    };
    visit((r.mvs as { root: { kind: string } }).root);
    expect(kinds).toEqual([
      'root',
      'download',
      'parse',
      'structure',
      'component',
      'representation',
      'color',
      'component',
      'representation',
    ]);
  });

  it('allows a snippet to declare its own builder and use await', async () => {
    const r = await run(
      `const builder = snapshot();\nawait Promise.resolve();\nbuilder.canvas({ background_color: 'white' });`,
    );
    expect(r.ok).toBe(true);
  });

  it('reports a run-time error at its line in the snippet', async () => {
    const r = await run(
      [
        'interface Options { a: number }',
        'const s = builder.canvas({ background_color: "white" });',
        '',
        'throw new Error("boom");',
      ].join('\n'),
    );
    expect(r).toEqual({ ok: false, error: { message: 'Error: boom', line: 4 } });
  });

  it('reports the line of a failing call inside a nested function', async () => {
    const r = await run(
      ['const pick = (t: string) => {', '  return molql(t);', '};', 'pick("this is (not a selection");'].join('\n'),
    );
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error.line).toBe(2);
    expect(r.error.message).toMatch(/molql\("this is \(not a selection"\)/);
  });

  it('reports a syntax error before running anything', async () => {
    const r = await run('builder.canvas({ background_color: "white" };');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.line).toBe(1);
  });

  it('rejects data that is not a valid MVS tree, without a line', async () => {
    const r = await run(
      `builder.download({ url: 'x.cif' }).parse({ format: 'mmcif' }).modelStructure().component({ selector: 'polymer' }).representation({ type: 'nonsense' as any });`,
    );
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error.line).toBeUndefined();
    expect(r.error.message).toMatch(/nonsense|type/);
  });

  it('rejects a misspelled parameter (noExtra)', async () => {
    const r = await run(`builder.canvas({ background_colour: 'white' } as any);`);
    expect(r.ok).toBe(false);
  });

  it('pymol(text) is molql(text, "pymol"), compiled at once', async () => {
    const part = (selector: string) =>
      `builder.download({ url: 'x.cif' }).parse({ format: 'mmcif' }).modelStructure().component({ selector: ${selector} }).representation();`;
    const a = await run(part("pymol('byres ((chain A and polymer) within 5 of resn STI)')"));
    const b = await run(part("molql('byres ((chain A and polymer) within 5 of resn STI)', 'pymol')"));
    expect(a.ok).toBe(true);
    expect(a.ok && b.ok && JSON.stringify(a.mvs.root)).toBe(b.ok ? JSON.stringify(b.mvs.root) : '');
    const bad = await run(`const x = 1;\npymol('this is (not a selection');`);
    expect(bad.ok).toBe(false);
    if (!bad.ok) {
      expect(bad.error.line).toBe(2);
      expect(bad.error.message).toMatch(/pymol\("this is \(not a selection"\) is not a PyMOL selection/);
    }
  });

  it('resolves asset() against the address of the page', async () => {
    const code = `builder.download({ url: asset('x.json') });`;
    const ok = await runSnippetWith(inProcessRunner, code, { base: 'https://example.org/talk/?mode=playground' });
    expect(JSON.stringify(ok)).toContain('"url":"https://example.org/talk/data/x.json"');
    const none = await runSnippetWith(inProcessRunner, code, { base: '' });
    expect(none.ok).toBe(false);
    if (!none.ok) expect(none.error).toMatchObject({ line: 1, message: expect.stringMatching(/needs the address/) });
  });
});

describe('tmAlign (through a host the test injects)', () => {
  const MATRIX = [0, 1, 0, 0, -1, 0, 0, 0, 0, 0, 1, 0, 5, 6, 7, 1];
  const fit: TmAlignResult = { matrix: MATRIX, tmScore: 0.87, rmsd: 1.5, alignedLength: 250 };
  const hostOf = (tmAlign: HostCalls['tmAlign']): HostCalls => ({ tmAlign });
  const call = `const fit = await tmAlign({
  reference: { url: 'https://x.test/a.bcif', format: 'bcif', chain: 'A' },
  mobile: { url: 'https://x.test/b.bcif', format: 'bcif' },
});`;
  const scene = `${call}
builder.download({ url: 'https://x.test/b.bcif' }).parse({ format: 'bcif' }).modelStructure().transform({ matrix: fit.matrix });`;

  it('asks the page with the two files, and uses the answer in the scene', async () => {
    const tmAlign = vi.fn(async () => fit);
    const r = await runSnippetWith(inProcessRunner, scene, { host: hostOf(tmAlign) });
    expect(r.ok).toBe(true);
    expect(tmAlign).toHaveBeenCalledWith({
      reference: { url: 'https://x.test/a.bcif', format: 'bcif', chain: 'A' },
      mobile: { url: 'https://x.test/b.bcif', format: 'bcif' },
    });
    expect(JSON.stringify(r)).toContain(`"matrix":${JSON.stringify(MATRIX)}`);
  });

  it('gives the snippet all four numbers', async () => {
    const r = await runSnippetWith(
      inProcessRunner,
      `${call}\nbuilder.canvas({ background_color: fit.tmScore > 0.5 && fit.rmsd < 2 && fit.alignedLength === 250 ? 'white' : 'red' });`,
      {
        host: hostOf(async () => fit),
      },
    );
    expect(JSON.stringify(r)).toContain('"background_color":"white"');
  });

  it('reports a failure of the page as an error at the line of the call', async () => {
    const r = await runSnippetWith(inProcessRunner, `const a = 1;\n${call}`, {
      host: hostOf(async () => {
        throw new Error('Could not download https://x.test/a.bcif (HTTP 404).');
      }),
    });
    expect(r).toEqual({
      ok: false,
      error: { line: 2, message: 'Error: tmAlign: Could not download https://x.test/a.bcif (HTTP 404).' },
    });
  });

  it('refuses a wrong call at its line, without asking the page', async () => {
    const tmAlign = vi.fn(async () => fit);
    const host = hostOf(tmAlign);
    const format = await runSnippetWith(
      inProcessRunner,
      `\nawait tmAlign({ reference: { url: 'u', format: 'pdb' as any }, mobile: { url: 'v', format: 'bcif' } });`,
      { host },
    );
    expect(format).toMatchObject({
      ok: false,
      error: { line: 2, message: expect.stringMatching(/format of reference must be 'bcif' or 'mmcif'/) },
    });
    const url = await runSnippetWith(
      inProcessRunner,
      `await tmAlign({ reference: { url: 'u', format: 'bcif' }, mobile: {} as any });`,
      { host },
    );
    expect(url).toMatchObject({ ok: false, error: { line: 1, message: expect.stringMatching(/mobile needs a url/) } });
    expect(tmAlign).not.toHaveBeenCalled();
  });

  it('says so when the run has no page', async () => {
    const r = await runSnippetWith(inProcessRunner, call);
    expect(r).toMatchObject({ ok: false, error: { line: 1, message: expect.stringMatching(/needs the page/) } });
  });
});

describe('runSvsSnippet (the sandbox runtime in process)', () => {
  const sequence = `
    const model = seq.data.complex({
      ref: 'model',
      provider: 'molstar:structure',
      source: { service: 'afdb', resource: 'structure', id: 'AF-P04637-F1' },
    });
    const regions = seq.data.annotation({
      ref: 'regions',
      geometry: 'ranges',
      target: model.unit('A'),
      numbering: 'label',
      value: [{ beg: 102, end: 292, label: 'DNA-binding' }],
    });
    const section = seq.view({ label: 'p53' }).section({});
    section.track({}).ruler();
    section.track({ label: 'Regions' }).ranges({ data: regions, labels: true });`;

  it('builds a SeqViewSpec document over a structure', async () => {
    const r = await runSvsSnippetWith(inProcessRunner, sequence);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.svs.format).toBe('seq_view_spec');
    expect(JSON.stringify(r.svs)).toContain('"provider":"molstar:structure"');
  });

  it('reports a run-time error at its line, as for MVS', async () => {
    const r = await runSvsSnippetWith(inProcessRunner, `const x = 1;\nseq.nonsense();`);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.line).toBe(2);
  });

  it('rejects a document Seq* does not accept, naming the problem', async () => {
    const r = await runSvsSnippetWith(
      inProcessRunner,
      `${sequence}\nsection.track({ label: 'Bad' }).ranges({ data: 'nowhere' });`,
    );
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.message).toMatch(/nowhere/);
  });
});
