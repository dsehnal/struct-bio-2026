/**
 * Copyright (c) 2026 mol* contributors, licensed under MIT, See LICENSE file for more info.
 *
 * Developed in collaboration with Anyfold <https://anyfold.ai/>
 *
 * @author David Sehnal <david.sehnal@gmail.com>
 */

import { partsMap } from '../diagrams.js';
import { notes, slide, stage } from '../html.js';
import { stateNotSteps } from '../principles.js';

// Part 2, Describe, don't click (outline.md §2, 2 min). The diagram comes back as the map of parts 3–6.

export function part2(): string {
  return [
    slide({
      part: 2,
      notes: notes(
        'One diagram, and we will use it again as the map for the rest of the talk.',
        'On the left, <strong>data</strong>: structures and maps from PDBe, AlphaFold DB and EMDB, the volume server for density, and annotation tables such as CIF or JSON, or UniProt.',
        'In the middle, <strong>descriptions</strong>: MolViewSpec for a 3D scene, SeqViewSpec for a sequence view, and the query languages MolQL and SeqQL that say what to select. You write them in TypeScript or in Python, or by hand as JSON; I come back to Python at the end.',
        'On the right, <strong>viewers and outputs</strong>: Mol* and Prism in the web page, Seq* for sequences, and what you share or publish: stories, MVSX files, images.',
        'The point: the description in the middle is independent of what is on either side. Same description, different data, different viewer.',
      ),
      body: `
        <h2>Describe, don't click</h2>
        <p class="lead">A description says what to load, what to show and what it means. Viewers draw it.</p>
        ${stage(partsMap())}`,
    }),

    stateNotSteps(2),

    slide({
      part: 2,
      notes: notes(
        'A description is a tree: load, parse, make a structure, pick a component, give it a representation, give that a colour or a label. It is <strong>data</strong>, JSON, not code. So it can be validated, saved, shared, diffed and generated, by a person or by a script.',
        'Selections are a language of their own, MolQL. "Residues within 5 Å of the ligand" means the same thing everywhere, in the viewer, in a description, in a story. PyMOL, VMD and Jmol syntax compile to it, so what you already know still works.',
        'In the next part we write the smallest such tree, 8 lines.',
      ),
      body: `
        <h2>A description is a tree of steps, written as data</h2>
        ${stage(`<div class="chain"><span>download</span><i>→</i><span>parse</span><i>→</i><span>structure</span><i>→</i><span>component</span><i>→</i><span>representation</span><i>→</i><span>color · label</span></div>
        <ul class="points">
          <li>It is <strong>data</strong> (JSON), not code: it can be validated, saved, shared, diffed and generated.</li>
          <li>Selections are <strong>a language</strong> (MolQL): "residues within 5 Å of the ligand" means the same everywhere.</li>
          <li>PyMOL, VMD and Jmol selection syntax compiles to MolQL, so what you know still works.</li>
        </ul>`)}`,
    }),
  ].join('');
}
