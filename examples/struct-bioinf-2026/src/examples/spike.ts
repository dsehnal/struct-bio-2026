/**
 * Copyright (c) 2026 mol* contributors, licensed under MIT, See LICENSE file for more info.
 *
 * Developed in collaboration with Anyfold <https://anyfold.ai/>
 *
 * @author David Sehnal <david.sehnal@gmail.com>
 */

import { edit } from './edit.js';
import type { Example } from './types.js';

// Example C, the SARS-CoV-2 spike as a light story (outline.md §6, steps 1-5). EMD-21375 is the map of 6VSB (contour 0.19,
// the author's), chain A of 6VSB has the RBD up (RBD 319-541), and 6M0J holds the RBD (chain E) on ACE2 (chain A) with the
// interface residues of _spec/examples.md C. The map is the PDBe volume server's, streamed. Code lines stay under 68
// characters (the editor's width).

const STORY = `// The spike of SARS-CoV-2 as a story: five snapshots of one
// description, each with a short text.
const SPIKE = 'https://www.ebi.ac.uk/pdbe/entry-files/download/6vsb.bcif';
const COMPLEX = 'https://www.ebi.ac.uk/pdbe/entry-files/download/6m0j.bcif';

// The map EMD-21375, streamed at the author's contour level (0.19)
const level = { kind: 'absolute', absoluteValue: 0.19 } as const;
const map = {
  molstar_volume_streaming: {
    view: 'auto',
    entries: [
      { dataId: 'EMD-21375', source: { name: 'em', params: { isoValue: level } } },
    ],
    channel_params: {
      em: { isoValue: level, color: '#6f8fd8', opacity: 0.5 },
    },
  },
};

// The spike (6VSB): chains A, B and C. Chain A has its receptor-binding
// domain (RBD, residues 319 to 541) up.
const spike = (view: MVSBuilder, withMap: boolean) =>
  view
    .download({ url: SPIKE })
    .parse({ format: 'bcif' })
    .modelStructure(withMap ? { custom: map } : {});
const rbd = (chain: string) => ({
  auth_asym_id: chain,
  beg_auth_seq_id: 319,
  end_auth_seq_id: 541,
});
const chain = (id: string) => ({ auth_asym_id: id });

// 1. The map: the shape you see first
const s1 = snapshot({
  title: '1. The map',
  description:
    'The cryo-EM map **EMD-21375**, contoured at 0.19. This is what ' +
    'the experiment gives: a shape, not yet atoms.',
  duration_ms: 3000,
});
spike(s1, true).component({ selector: 'polymer' }).focus();

// 2. The model inside the map
const s2 = snapshot({
  title: '2. The model in the map',
  description:
    'The fitted model **6VSB**, three chains in three colours. The map ' +
    'is the evidence, the model is the interpretation.',
  duration_ms: 3000,
});
s2.transition({ duration_ms: 1500 });
const m2 = spike(s2, true);
m2.component({ selector: chain('A') })
  .representation({ type: 'cartoon' })
  .color({ color: '#e15759' });
m2.component({ selector: chain('B') })
  .representation({ type: 'cartoon' })
  .color({ color: '#4e79a7' });
m2.component({ selector: chain('C') })
  .representation({ type: 'cartoon' })
  .color({ color: '#59a14f' });
m2.component({ selector: 'polymer' }).focus();

// 3. The glycans: the shield
const s3 = snapshot({
  title: '3. The glycan shield',
  description:
    'Sugars (**N-acetylglucosamine** and the chains built on it) cover ' +
    'much of the surface and hide the protein from antibodies.',
  duration_ms: 3000,
});
s3.transition({ duration_ms: 1500 });
const m3 = spike(s3, false);
m3.component({ selector: 'protein' })
  .representation({ type: 'cartoon' })
  .color({ color: 'lightgray' })
  .opacity({ opacity: 0.6 });
m3.component({ selector: molql('resn NAG') })
  .representation({ type: 'spacefill' })
  .color({ color: 'orange' });
m3.component({ selector: 'polymer' }).focus();

// 4. One RBD is up
const s4 = snapshot({
  title: '4. One RBD up',
  description:
    'In chain A the **receptor-binding domain** is lifted away from ' +
    'the trimer: its centre is 59 Å from the centre, against 47 and ' +
    '46 Å in chains B and C. Only an "up" RBD can bind the receptor.',
  duration_ms: 4000,
});
s4.transition({ duration_ms: 1500 });
const m4 = spike(s4, false);
// One drawing of the whole protein; the RBDs are colour layers on it
m4.component({ selector: 'protein' })
  .representation({ type: 'cartoon' })
  .color({ color: 'lightgray' })
  .color({ selector: rbd('A'), color: '#e15759' })
  .color({ selector: rbd('B'), color: '#4e79a7' })
  .color({ selector: rbd('C'), color: '#4e79a7' });
m4.component({ selector: rbd('A') }).focus({ radius_factor: 1.5 });

// 5. The RBD on its receptor (6M0J: the RBD is chain E, ACE2 is chain A)
const s5 = snapshot({
  title: '5. RBD bound to ACE2',
  description:
    'In **6M0J** the RBD (chain E) sits on the human receptor ACE2 ' +
    '(chain A). Sticks are the interface residues within 4 Å. ' +
    '**K417**, **Q493** and **N501** are positions changed in variants ' +
    'of concern.',
  duration_ms: 5000,
});
s5.transition({ duration_ms: 1500 });
const m5 = s5
  .download({ url: COMPLEX })
  .parse({ format: 'bcif' })
  .modelStructure();
const at = (id: string, numbers: number[]) =>
  numbers.map((n) => ({ auth_asym_id: id, auth_seq_id: n }));
const rbdSide = at('E', [
  417, 446, 449, 453, 455, 456, 475, 486, 487, 489, 493, 496, 498, 500,
  501, 502, 505,
]);
const aceSide = at('A', [
  24, 27, 28, 30, 31, 34, 35, 37, 38, 41, 42, 79, 82, 83, 330, 353,
  354, 355, 357, 393,
]);
m5.component({ selector: chain('A') })
  .representation({ type: 'cartoon' })
  .color({ color: '#9ecae1' });
m5.component({ selector: chain('E') })
  .representation({ type: 'cartoon' })
  .color({ color: '#e15759' });
m5.component({ selector: rbdSide })
  .representation({ type: 'ball_and_stick' })
  .color({ color: '#e15759' });
m5.component({ selector: aceSide })
  .representation({ type: 'ball_and_stick' })
  .color({ color: '#4e79a7' });
for (const n of [417, 493, 501]) {
  m5.component({ selector: at('E', [n]) }).label({ text: 'E' + n });
}
m5.component({ selector: rbdSide }).focus({ radius_factor: 1.8 });
`;

export const SpikeExample: Example = {
  id: 'spike',
  title: 'The spike',
  tagline: 'A light story: map, model, glycans, one RBD up, ACE2.',
  snippets: [
    {
      id: 'spike-story',
      kind: 'mvs',
      title: 'SARS-CoV-2 spike: a story in five snapshots',
      summary:
        'From the cryo-EM map to the model, the glycan shield, the one RBD that is up, and the RBD on its receptor. Use the story controls in the viewer to step through.',
      code: STORY,
    },
  ],
  edits: [
    edit(
      'Contour the map higher',
      'The map is drawn at 0.19, the level the authors chose. Raise it to 0.3: the first two snapshots lose the weaker parts of the map.',
      STORY,
      ['absoluteValue: 0.19', 'absoluteValue: 0.3'],
    ),
    edit(
      'Change the glycan colour',
      'The sugars of the third snapshot are orange. Pick another colour name, for example magenta.',
      STORY,
      ["color: 'orange'", "color: 'magenta'"],
    ),
    edit(
      'Label one more variant position',
      'Add Y505 to the list of residues that get a label in the last snapshot.',
      STORY,
      ['[417, 493, 501]', '[417, 493, 501, 505]'],
    ),
  ],
};
