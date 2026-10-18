/**
 * Copyright (c) 2026 mol* contributors, licensed under MIT, See LICENSE file for more info.
 *
 * Developed in collaboration with Anyfold <https://anyfold.ai/>
 *
 * @author David Sehnal <david.sehnal@gmail.com>
 */

import { highlight } from '../highlight.js';
import { notes, slide } from '../html.js';
import { snippetSlide } from '../snippet.js';
import { opener } from './opener.js';

// Part 4, Sequences: Seq*, SeqViewSpec (outline.md §4).

/** A short SeqViewSpec in builder code, cut from the `p53-sequence` snippet (src/examples/p53.ts): data once, then a view. */
const SvsBuilder = `// Data, once: the structure to link to, a table, a computed track
const model = seq.data.complex({
  ref: 'model',
  provider: 'molstar:structure',
  source: {
    service: 'afdb', resource: 'structure', id: 'AF-P04637-F1',
  },
});
const hotspots = seq.data.annotation({
  ref: 'hotspots',
  geometry: 'ranges',
  target: model.unit('A'),
  numbering: 'label',
  value: [
    { beg: 248, end: 248, label: 'R248', category: 'contact' },
    { beg: 175, end: 175, label: 'R175', category: 'structural' },
  ],
});
const plddt = seq.data.computed({
  ref: 'plddt', provider: 'molstar:plddt', options: { of: model },
});

// Then a view of it: one row per track
const section = seq
  .view({ label: 'p53' })
  .section({ style: 'compact' });
section.track({ label: 'Sequence' }).letters();
section.track({ label: 'Hotspots' }).points({ data: hotspots });
section.track({ label: 'pLDDT' }).values({ data: plddt });`;

export function part4(): string {
  return [
    opener({
      part: 4,
      title: 'Sequences',
      time: '19–25 min',
      points: [
        '<strong>Seq*</strong>: a sequence viewer built for the same descriptions: alignments, tracks, many sequences, linked to 3D',
        '<strong>SeqViewSpec</strong>: what to show on a sequence',
      ],
      notes: notes(
        'Sequences. Two names, one map.',
        '- <strong>Seq*</strong> is a sequence viewer built for the same descriptions. It handles alignments, tracks, many sequences, and linking to 3D.',
        '- <strong>SeqViewSpec</strong> is the sequence counterpart of MolViewSpec: the same node shape, the same <code>*_from_uri</code> annotations, and snapshots. It says what to show, not how to draw it.',
        'On the map: they are the middle and right columns for sequences. The Seq* storybook has more (alignments, tracks, streaming) for anyone who asks.',
      ),
    }),

    slide({
      part: 4,
      notes: notes(
        'Why a description for sequences too? Because sequence data comes from many places, each in its own coordinates.',
        '- <strong>UniProt</strong>: the canonical sequence, with its features and variants in UniProt positions.',
        '- <strong>The structure</strong>: the chains as modelled, often only part of the sequence, with gaps, tags and engineered mutations, in auth or label numbering.',
        '- <strong>Predicted models</strong>: AlphaFold DB uses UniProt positions, and carries pLDDT per residue.',
        '- <strong>Alignments and annotation services</strong>: their own columns and ranges.',
        'So a sequence view has to say <strong>which</strong> sequence, in <strong>which numbering</strong>, and how it links to the 3D model. SeqViewSpec does that: data is defined once, each piece with its numbering and its link to a structure, then <strong>views</strong> of it: sections, tracks, and what each track shows. Same node shape as MolViewSpec, the same annotations from files, snapshots as patches.',
        'The code is cut from the p53 snippet on the next slide. In the playground the second tab shows the JSON it produces.',
      ),
      body: `
        <h2>SeqViewSpec: the same idea for sequences</h2>
        <div class="two-col">
          <div class="stack panel"><pre class="code nowrap"><code>${highlight(SvsBuilder, 'ts')}</code></pre></div>
          <div class="stack">
            <span class="code-label">WHERE SEQUENCE DATA COMES FROM</span>
            <ul class="points small">
              <li><strong>UniProt</strong>: the canonical sequence, features and variants, in UniProt positions.</li>
              <li><strong>The structure</strong>: what was modelled, with gaps and tags, in auth or label numbering.</li>
              <li><strong>Predicted models</strong>: AlphaFold DB, in UniProt positions, with pLDDT.</li>
              <li><strong>Alignments, annotation services</strong>: their own columns and ranges.</li>
            </ul>
            <p class="state-note">Each source counts differently. A SeqViewSpec says <strong>which</strong> sequence, in <strong>which numbering</strong>, linked to which <strong>structure</strong>; then the views of it.</p>
          </div>
        </div>`,
    }),

    snippetSlide({
      part: 4,
      snippetId: 'p53-sequence',
      sceneId: 'p53-af-plddt',
      title: 'Example A again: the p53 sequence, linked to the model',
      lead: 'Hover a residue in the sequence and it lights up in 3D, and the reverse. Tracks: regions, hotspots, pLDDT.',
      notes: notes(
        'Prism loads both a MolViewSpec tree and a SeqViewSpec document, so the sequence band and the 3D view show the same example. The 3D scene on the right is the AlphaFold model from part 3; the band under it is this SeqViewSpec.',
        'The tracks are tables of ranges: the domains from UniProt (transactivation, DNA-binding, oligomerisation), the disordered regions, the six hotspots (contact vs structural, same colours as before), and the pLDDT read from the model.',
        '<strong>Linking</strong>: hover a residue in the sequence and it lights up in 3D, and the reverse. Do it on R248 and R273.',
        'Second tab: the SeqViewSpec document the builder produced.',
      ),
    }),
  ].join('');
}
