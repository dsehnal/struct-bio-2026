/**
 * Copyright (c) 2026 mol* contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author David Sehnal <david.sehnal@gmail.com>
 */

import { edit } from './edit.js';
import type { Example } from './types.js';

// Superposition: ABL with imatinib (1IEP, inactive, DFG-out) and with dasatinib (2GQG, active, DFG-in), chains A
// (_spec/examples.md D). MVS has no superpose node: a structure takes a transform. The runner's `tmAlign` (the page
// downloads both files and runs Mol*'s TM-align) gives the matrix, so the snippet needs no numbers of its own. Code
// lines stay under 68 characters (the editor's width).

const SUPERPOSE = `// ABL with two drugs. 1IEP: imatinib, the kinase inactive (DFG-out).
// 2GQG: dasatinib, the kinase active (DFG-in).
const pdbe = 'https://www.ebi.ac.uk/pdbe/entry-files/download';
const files = {
  imatinib: \`\${pdbe}/1iep.bcif\`,
  dasatinib: \`\${pdbe}/2gqg.bcif\`,
};

// TM-align finds how to move 2GQG onto 1IEP: the matrix, and how
// well the two folds agree. It takes a few seconds.
const fit = await tmAlign({
  reference: { url: files.imatinib, format: 'bcif', chain: 'A' },
  mobile: { url: files.dasatinib, format: 'bcif', chain: 'A' },
});

const imatinibAbl = builder
  .download({ url: files.imatinib })
  .parse({ format: 'bcif' })
  .modelStructure();

// Move 2GQG by that matrix. Delete .transform and the two parts.
const dasatinibAbl = builder
  .download({ url: files.dasatinib })
  .parse({ format: 'bcif' })
  .modelStructure()
  .transform({ matrix: fit.matrix });

// The proteins: chain A of each, faint
imatinibAbl
  .component({ selector: { auth_asym_id: 'A' } })
  .representation({ type: 'cartoon' })
  .color({ color: 'tan' })
  .opacity({ opacity: 0.5 });
dasatinibAbl
  .component({ selector: { auth_asym_id: 'A' } })
  .representation({ type: 'cartoon' })
  .color({ color: 'lightsteelblue' })
  .opacity({ opacity: 0.5 });

// The drugs: imatinib (STI 201), dasatinib (1N1 501)
const imatinib = imatinibAbl.component({
  selector: { auth_asym_id: 'A', auth_seq_id: 201 },
});
imatinib.representation({ type: 'ball_and_stick' }).color({ color: 'orange' });
imatinib.focus({ radius_factor: 1.6 });
const dasatinib = dasatinibAbl.component({
  selector: { auth_asym_id: 'A', auth_seq_id: 501 },
});
dasatinib
  .representation({ type: 'ball_and_stick' })
  .color({ color: 'steelblue' });
// TM-score: 1 is identical folds; above 0.5 is the same fold
dasatinib.label({ text: 'TM-score ' + fit.tmScore.toFixed(2) });

// F382 of the DFG motif: it flips by 8 Å between the two states
const outF382 = imatinibAbl.component({
  selector: { auth_asym_id: 'A', auth_seq_id: 382 },
});
outF382
  .representation({ type: 'ball_and_stick' })
  .color({ color: 'saddlebrown' });
outF382.label({ text: 'F382 out' });
const inF382 = dasatinibAbl.component({
  selector: { auth_asym_id: 'A', auth_seq_id: 382 },
});
inF382.representation({ type: 'ball_and_stick' }).color({ color: 'navy' });
inF382.label({ text: 'F382 in' });
`;

export const SuperpositionExample: Example = {
  id: 'superposition',
  title: 'Two ABL states',
  tagline: 'Superposition: imatinib (DFG-out) and dasatinib (DFG-in).',
  snippets: [
    {
      id: 'abl-superposition',
      kind: 'mvs',
      title: 'Two drugs, two states of ABL',
      summary:
        'ABL with imatinib (inactive, DFG-out) and with dasatinib (active, DFG-in), superposed by TM-align on their kinase chains: the DFG phenylalanine flips and the two drugs fill different parts of the pocket.',
      code: SUPERPOSE,
    },
  ],
  edits: [
    edit(
      'Without the superposition',
      'Delete the transform: each structure stays in its own crystal frame, and they no longer overlap.',
      SUPERPOSE,
      ['  .modelStructure()\n  .transform({ matrix: fit.matrix });', '  .modelStructure();'],
    ),
    edit(
      'The gatekeeper',
      'T315 touches both drugs and does not move between the states. Show it in both structures.',
      SUPERPOSE,
      [
        '// F382 of the DFG motif',
        `// T315, the gatekeeper: the same place in both
for (const s of [imatinibAbl, dasatinibAbl]) {
  s.component({ selector: { auth_asym_id: 'A', auth_seq_id: 315 } })
    .representation({ type: 'ball_and_stick' })
    .color({ color: 'crimson' });
}

// F382 of the DFG motif`,
      ],
    ),
  ],
};
