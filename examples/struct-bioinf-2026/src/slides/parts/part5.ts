/**
 * Copyright (c) 2026 mol* contributors, licensed under MIT, See LICENSE file for more info.
 *
 * Developed in collaboration with Anyfold <https://anyfold.ai/>
 *
 * @author David Sehnal <david.sehnal@gmail.com>
 */

import { volumeServerDiagram } from '../diagrams.js';
import { notes, slide, stage } from '../html.js';
import { snippetSlide } from '../snippet.js';
import { opener } from './opener.js';

// Part 5, Volumes, with example B: imatinib in ABL (outline.md §5, 5 min).

export function part5(): string {
  return [
    opener({
      part: 5,
      title: 'Volumes',
      time: '25–30 min, with example B: imatinib',
      points: [
        '<strong>The volume server</strong>: only the box and the detail you ask for',
        '<strong>In MolViewSpec</strong>: a volume node, isosurface or slice',
        '<strong>Example B</strong>: imatinib in ABL kinase, a drug and its evidence',
      ],
      notes: notes(
        'Volumes, five minutes. This builds on EMDB from Tuesday and on ChEMBL from this morning.',
        'On the map: the volume server is on the data side, and it feeds a volume node in the description, which Prism draws.',
        'First the principle of the volume server, then example B: imatinib in ABL kinase.',
      ),
    }),

    slide({
      part: 5,
      notes: notes(
        'The principle of the volume server. Maps are large: a cryo-EM map can be gigabytes. But you usually need a box around what you look at, say a ligand, and not the whole map.',
        'So the server keeps each map at <strong>several levels of detail</strong>, precomputed. You ask for a box and a level, and it returns only that region as BinaryCIF. A small box gets the fine level, full resolution. A large box, or the whole map, gets a coarse level. That is why PDBe and EMDB pages show density in seconds.',
        'It serves both X-ray maps (2Fo-Fc, Fo-Fc) and cryo-EM maps.',
        'In MolViewSpec it is a <code>volume</code> node with an isosurface or a grid-slice representation. Streaming around a selection is set with the <code>molstar_volume_streaming</code> custom property: the description says "around this residue", and the viewer asks the server for just that box.',
      ),
      body: `
        <h2>The volume server: only what you ask for</h2>
        <p class="lead">A large map stored once at several levels of detail. You ask for a box; it returns just that region, as BinaryCIF.</p>
        ${stage(volumeServerDiagram())}`,
    }),

    snippetSlide({
      part: 5,
      snippetId: 'imatinib-pocket',
      title: 'Example B: imatinib in its pocket',
      lead: '1IEP, c-Abl kinase with imatinib: the residues within 5 Å and the hydrogen bonds.',
      notes: notes(
        'Example B: imatinib (Gleevec) in ABL kinase, a drug and its evidence. The structure is 1IEP, the c-Abl kinase domain with STI-571, which is imatinib.',
        'First the pocket: the residues within 5 Å of the ligand, and the hydrogen bonds. The kinase is in the DFG-out conformation: imatinib binds the inactive form. Y253 is in the P-loop.',
        "Find the gatekeeper, T315: the next slide labels it. T315I is the clinical resistance mutation, and the threonine's hydroxyl forms a hydrogen bond to imatinib, so the isoleucine breaks it and adds bulk.",
      ),
    }),

    snippetSlide({
      part: 5,
      snippetId: 'imatinib-density',
      title: 'Is the ligand supported by the data?',
      lead: '2Fo-Fc density around imatinib, from the volume server. T315, the gatekeeper, labelled.',
      notes: notes(
        'The 2Fo-Fc density around the ligand, streamed from the PDBe volume server for just this box. The question every structural biologist asks: is the ligand supported by the data? This ties to validation and PDB-REDO from Tuesday.',
        'The density is a volume node in the description, with an iso level in sigma. The box follows the ligand.',
        'The gatekeeper T315 is labelled.',
        'Try it: change the iso level (σ), or move the box to another residue.',
      ),
    }),
  ].join('');
}
