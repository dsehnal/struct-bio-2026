/**
 * Copyright (c) 2026 mol* contributors, licensed under MIT, See LICENSE file for more info.
 *
 * Developed in collaboration with Anyfold <https://anyfold.ai/>
 *
 * @author David Sehnal <david.sehnal@gmail.com>
 */

import { MVSData } from '@molstar/mvs-builder';
import { describe, expect, it } from 'vitest';
import { validateMvs } from '../validate.js';

function tree() {
  const builder = MVSData.createBuilder();
  builder.download({ url: 'x.cif' }).parse({ format: 'mmcif' }).modelStructure().component().representation();
  return JSON.parse(JSON.stringify(builder.getState()));
}

describe('validateMvs', () => {
  it('accepts what the builder builds', () => {
    expect(validateMvs(tree()).ok).toBe(true);
  });

  it('accepts multi-state data', () => {
    const builder = MVSData.createBuilder();
    builder.canvas({ background_color: 'white' });
    const multi = MVSData.createMultistate([builder.getSnapshot({ title: 'a' })]);
    expect(validateMvs(JSON.parse(JSON.stringify(multi))).ok).toBe(true);
  });

  it.each([undefined, null, 'text', 3, []])('rejects %j as not MVS data', (data) => {
    const r = validateMvs(data);
    expect(r.ok).toBe(false);
  });

  it('rejects a missing version and a missing root', () => {
    const data = tree();
    delete data.metadata.version;
    expect(validateMvs(data).ok).toBe(false);
    const noRoot = tree();
    delete noRoot.root;
    expect(validateMvs(noRoot)).toEqual({ ok: false, issues: [expect.stringContaining('root')] });
  });

  it('names the node and the parameter that are wrong', () => {
    const data = tree();
    data.root.children[0].params.url = 3;
    const r = validateMvs(data);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.issues.join('\n')).toMatch(/url/);
  });

  it('reports at most five issues', () => {
    const data = tree();
    data.root.children = Array.from({ length: 10 }, () => ({ kind: 'download', params: {} }));
    const r = validateMvs(data);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.issues.length).toBeLessThanOrEqual(5);
  });

  it('rejects a MolQL expression with an unknown symbol', () => {
    const data = tree();
    const component = data.root.children[0].children[0].children[0].children[0];
    component.params.selector = { molql: { head: 'no.such.symbol', args: [] } };
    expect(validateMvs(data).ok).toBe(false);
  });
});
