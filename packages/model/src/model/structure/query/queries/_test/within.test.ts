/**
 * Copyright (c) 2026 mol* contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author David Sehnal <david.sehnal@gmail.com>
 */

import { describe, expect, it } from 'vitest';
import { CIF } from '@molstar/io/reader/cif';
import { trajectoryFromMmCIF } from '@molstar/model/formats/structure/mmcif';
import { Structure } from '../../../structure/structure.js';
import { StructureElement } from '../../../structure/element.js';
import { StructureProperties } from '../../../structure/properties.js';
import { StructureQuery } from '../../query.js';
import { StructureSelection } from '../../selection.js';
import type { QueryContext } from '../../context.js';
import { atoms } from '../generators.js';
import { within } from '../filters.js';

/** Chain A: one carbon at the origin. Chain B: one carbon per residue at 3.9, 4.5 and 5.2 Å from it. */
function mmcif() {
  const lines = [
    'data_T',
    'loop_',
    ...'group_PDB id type_symbol label_atom_id label_alt_id label_comp_id label_asym_id label_entity_id label_seq_id pdbx_PDB_ins_code Cartn_x Cartn_y Cartn_z occupancy B_iso_or_equiv auth_seq_id auth_comp_id auth_asym_id auth_atom_id pdbx_PDB_model_num'
      .split(' ')
      .map((c) => `_atom_site.${c}`),
    'HETATM 1 C C1 . LIG A 1 . ? 0 0 0 1 10 1 LIG A C1 1',
  ];
  [3.9, 4.5, 5.2].forEach((x, i) => {
    lines.push(`HETATM ${i + 2} C C1 . LIG B 2 . ? ${x} 0 0 1 10 ${i + 1} LIG B C1 1`);
  });
  return `${lines.join('\n')}\n`;
}

async function createStructure() {
  const parsed = await CIF.parseText(mmcif()).run();
  if (parsed.isError) throw new Error(parsed.message);
  const trajectory = await trajectoryFromMmCIF(parsed.result.blocks[0], parsed.result).run();
  return Structure.ofModel(trajectory.representative);
}

const chain = (id: string) =>
  atoms({ atomTest: (ctx: QueryContext) => StructureProperties.chain.auth_asym_id(ctx.element) === id });

/** The auth_seq_ids of chain B's atoms that `within` keeps. */
function kept(structure: Structure, params: Partial<Parameters<typeof within>[0]>) {
  const query = within({ query: chain('B'), target: chain('A'), maxRadius: 4, ...params });
  const loci = StructureSelection.toLociWithSourceUnits(StructureQuery.run(query, structure));
  const ids: number[] = [];
  StructureElement.Loci.forEachLocation(loci, (l) => ids.push(StructureProperties.residue.auth_seq_id(l)));
  return ids.sort((a, b) => a - b);
}

describe('within', () => {
  it('measures centre to centre when no atom radius is given (the default lookup path)', async () => {
    const structure = await createStructure();
    expect(kept(structure, {})).toEqual([1]);
  });

  it('measures centre to centre with a min-radius of 0 (the min/max path)', async () => {
    const structure = await createStructure();
    expect(kept(structure, { minRadius: 0, elementRadius: () => 0 })).toEqual([1]);
  });

  it('adds the atom radius only when one is given', async () => {
    const structure = await createStructure();
    // 1 Å on each atom: up to 6 Å centre to centre
    expect(kept(structure, { minRadius: 0, elementRadius: () => 1 })).toEqual([1, 2, 3]);
  });

  it('adds the atom radius without a min-radius too (PyMOL gap)', async () => {
    const structure = await createStructure();
    expect(kept(structure, { elementRadius: () => 0.3 })).toEqual([1, 2]);
  });

  it('inverts', async () => {
    const structure = await createStructure();
    expect(kept(structure, { invert: true })).toEqual([2, 3]);
  });
});
