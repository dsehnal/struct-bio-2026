/**
 * Copyright (c) 2026 mol* contributors, licensed under MIT, See LICENSE file for more info.
 *
 * Developed in collaboration with Anyfold <https://anyfold.ai/>
 *
 * @author David Sehnal <david.sehnal@gmail.com>
 */

import { describe, expect, it } from 'vitest';
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

  it('resolves asset() against the address of the page', async () => {
    const code = `builder.download({ url: asset('x.json') });`;
    const ok = await runSnippetWith(inProcessRunner, code, { base: 'https://example.org/talk/?mode=playground' });
    expect(JSON.stringify(ok)).toContain('"url":"https://example.org/talk/data/x.json"');
    const none = await runSnippetWith(inProcessRunner, code, { base: '' });
    expect(none.ok).toBe(false);
    if (!none.ok) expect(none.error).toMatchObject({ line: 1, message: expect.stringMatching(/needs the address/) });
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
