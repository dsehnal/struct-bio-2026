/**
 * Copyright (c) 2026 mol* contributors, licensed under MIT, See LICENSE file for more info.
 *
 * Developed in collaboration with Anyfold <https://anyfold.ai/>
 *
 * @author David Sehnal <david.sehnal@gmail.com>
 */

import { describe, expect, it } from 'vitest';
import { SAMPLE } from './samples.js';
import { typeErrors } from './typecheck.js';

const errors = (code: string) => typeErrors(code, 'mvs');

describe('the generated typings', () => {
  it('check the sample snippet', () => {
    expect(errors(SAMPLE)).toEqual([]);
  });

  it('check the multi-state, MolScript and alias globals', () => {
    expect(
      errors(`
        const view: MVSBuilder = snapshot({ title: 'a', duration_ms: 500 });
        const s: MVSStructure = view.download({ url: 'x.cif' }).parse({ format: 'mmcif' }).modelStructure();
        const c: MVSComponent = s.component({ selector: molql('chain A', 'vmd') });
        const r: MVSRepresentation = c.representation({ type: 'surface' });
        const color: MVSColor = '#ff0000';
        r.color({ color });
        const expression: MVSExpression = { label_asym_id: 'A', beg_auth_seq_id: 10, end_auth_seq_id: 20 };
        s.component({ selector: [expression, { label_asym_id: 'B' }] });
        const same: typeof MolScriptBuilder = MolScriptBuilder;
        console.log(same);
      `),
    ).toEqual([]);
  });

  it('report an unknown representation type, at its line', () => {
    const found = errors(
      `${SAMPLE}builder.download({ url: 'x' }).parse({ format: 'bcif' }).modelStructure().component().representation({ type: 'cartoons' });\n`,
    );
    expect(found).toHaveLength(1);
    expect(found[0]).toMatch(/^line 7: .*cartoons/);
  });

  it('report an unknown parameter and a wrong parse format', () => {
    const found = errors(`const s = builder.download({ url: 'x', uri: 'y' }).parse({ format: 'pdbx' });`);
    expect(found.length).toBeGreaterThan(0);
  });

  it('report an unknown name', () => {
    expect(errors('buildr.canvas({});')).toEqual([expect.stringContaining("Cannot find name 'buildr'")]);
  });

  it('declare const in two snippets without clashing (every file is a module)', () => {
    expect(errors('const x = 1;\nexport {};')).toEqual([]);
  });

  it('check the SeqViewSpec typings, and report a misspelled step', () => {
    const svs = `
      const model = seq.data.complex({ provider: 'molstar:structure', source: { service: 'pdbe', id: '1tsr' } });
      seq.view({ label: 'v' }).section({}).track({ label: 'r' }).ruler();
      console.log(asset('x.json'), model.ref);`;
    expect(typeErrors(svs, 'svs')).toEqual([]);
    const found = typeErrors('seq.view({ label: "v" }).section({}).track({}).rulerr();', 'svs');
    expect(found).toHaveLength(1);
    expect(found[0]).toMatch(/rulerr/);
    // The MVS typings do not know seq, and the SVS typings do not know builder.
    expect(typeErrors('seq.data;', 'mvs')[0]).toMatch(/Cannot find name 'seq'/);
    expect(typeErrors('builder.canvas({});', 'svs')[0]).toMatch(/Cannot find name 'builder'/);
  });
});
