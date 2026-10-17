/**
 * Copyright (c) 2026 mol* contributors, licensed under MIT, See LICENSE file for more info.
 *
 * Developed in collaboration with Anyfold <https://anyfold.ai/>
 *
 * @author David Sehnal <david.sehnal@gmail.com>
 */

import { edit } from './edit.js';
import type { Example } from './types.js';

// Example B, imatinib in the ABL kinase (outline.md §5). 1IEP chain A, imatinib is STI 201; T315 is the gatekeeper and
// D381-F382-G383 the DFG motif (_spec/examples.md B). The density is the PDBe volume server's, streamed around the view.
// Code lines stay under 68 characters (the editor's width).

const POCKET = `// Imatinib in the ABL kinase (1IEP, chain A): the drug, the residues
// around it, the gatekeeper and the DFG motif.
const structure = builder
  .download({
    url: 'https://www.ebi.ac.uk/pdbe/entry-files/download/1iep.bcif',
  })
  .parse({ format: 'bcif' })
  .modelStructure();

structure
  .component({ selector: { auth_asym_id: 'A' } })
  .representation({ type: 'cartoon' })
  .color({ color: 'lightgray' })
  .opacity({ opacity: 0.4 });

// Imatinib is the ligand STI, residue 201 of chain A.
const imatinib = structure.component({
  selector: { auth_asym_id: 'A', auth_seq_id: 201 },
});
imatinib
  .representation({ type: 'ball_and_stick' })
  .color({ color: 'orange' });
imatinib.focus({ radius_factor: 1.8 });

// The pocket: whole residues of the protein with an atom within 5 Å
// of imatinib. T315 (the gatekeeper) and the DFG motif (D381, F382,
// G383) get colours of their own.
structure
  .component({
    selector: molql(
      'polymer.protein and ' +
        'byres (chain A within 5 of (chain A and resn STI))',
    ),
  })
  .representation({ type: 'ball_and_stick', size_factor: 0.6 })
  .color({ color: 'steelblue' })
  .color({
    selector: { auth_asym_id: 'A', auth_seq_id: 315 },
    color: 'crimson',
  })
  .color({
    selector: {
      auth_asym_id: 'A',
      beg_auth_seq_id: 381,
      end_auth_seq_id: 383,
    },
    color: 'seagreen',
  });

// Labels
structure
  .component({ selector: { auth_asym_id: 'A', auth_seq_id: 315 } })
  .label({ text: 'T315 gatekeeper' });
structure
  .component({
    selector: {
      auth_asym_id: 'A',
      beg_auth_seq_id: 381,
      end_auth_seq_id: 383,
    },
  })
  .label({ text: 'DFG' });
`;

const DENSITY = `// The same drug, and the evidence for it: the 2Fo-Fc electron
// density around imatinib, from the PDBe volume server.
const structure = builder
  .download({
    url: 'https://www.ebi.ac.uk/pdbe/entry-files/download/1iep.bcif',
  })
  .parse({ format: 'bcif' })
  .modelStructure({
    custom: {
      // Show the maps of this entry around what the camera looks at.
      // Only a box around the view is downloaded.
      molstar_volume_streaming: {
        view: 'camera-target',
        channel_params: {
          // The density as a mesh, at 1.5 sigma (1.5 standard
          // deviations above the mean)
          '2fo-fc': {
            isoValue: { kind: 'relative', relativeValue: 1.5 },
            color: '#3a86ff',
            wireframe: true,
            opacity: 0.9,
          },
          // The difference maps are not drawn
          'fo-fc(+ve)': { opacity: 0 },
          'fo-fc(-ve)': { opacity: 0 },
        },
      },
    },
  });

structure
  .component({ selector: { auth_asym_id: 'A' } })
  .representation({ type: 'cartoon' })
  .color({ color: 'lightgray' })
  .opacity({ opacity: 0.4 });

const imatinib = structure.component({
  selector: { auth_asym_id: 'A', auth_seq_id: 201 },
});
imatinib
  .representation({ type: 'ball_and_stick' })
  .color({ color: 'orange' });
imatinib.focus({ radius_factor: 0.7 });

// The residues around it, as thin lines
structure
  .component({
    selector: molql(
      'polymer.protein and ' +
        'byres (chain A within 5 of (chain A and resn STI))',
    ),
  })
  .representation({ type: 'line' })
  .color({ color: 'gray' });

structure
  .component({ selector: { auth_asym_id: 'A', auth_seq_id: 315 } })
  .label({ text: 'T315 gatekeeper' });
`;

export const ImatinibExample: Example = {
  id: 'imatinib',
  title: 'Imatinib in ABL',
  tagline: 'A drug and its evidence: the pocket and the electron density.',
  snippets: [
    {
      id: 'imatinib-pocket',
      kind: 'mvs',
      title: 'Imatinib in its pocket',
      summary:
        'The residues within 5 Å of the drug, the gatekeeper T315 and the DFG motif, whose DFG-out conformation imatinib recognises.',
      code: POCKET,
    },
    {
      id: 'imatinib-density',
      kind: 'mvs',
      title: 'Is imatinib supported by the data?',
      summary:
        'The 2Fo-Fc electron density around the drug at 1.5 σ, streamed from the PDBe volume server: only the box you look at is downloaded.',
      code: DENSITY,
      edits: [
        edit(
          'Raise the contour',
          'A higher contour keeps only the strongest density. Change 1.5 to 2.5 σ: does the drug stay inside it?',
          DENSITY,
          ['relativeValue: 1.5', 'relativeValue: 2.5'],
        ),
        edit(
          'A solid surface',
          'Replace the mesh by a see-through surface: set wireframe to false and lower the opacity.',
          DENSITY,
          ['wireframe: true,\n            opacity: 0.9', 'wireframe: false,\n            opacity: 0.4'],
        ),
        edit(
          'Look at another residue',
          'The density follows the camera. Focus on the gatekeeper T315 instead of the drug and the box moves with it.',
          DENSITY,
          [
            'imatinib.focus({ radius_factor: 0.7 });\n',
            "structure\n  .component({ selector: { auth_asym_id: 'A', auth_seq_id: 315 } })\n  .focus({ radius_factor: 3 });\n",
          ],
        ),
      ],
    },
  ],
  edits: [
    edit('A wider pocket', 'Change the distance from 5 to 8 Å to see what lies a little further out.', POCKET, [
      'within 5 of',
      'within 8 of',
    ]),
    edit(
      'Show the interactions',
      'Add a custom property to the ligand component: Mol* then draws the non-covalent contacts (hydrogen bonds and others) within 5 Å of it.',
      POCKET,
      [
        "const imatinib = structure.component({\n  selector: { auth_asym_id: 'A', auth_seq_id: 201 },\n});",
        `const imatinib = structure.component({
  selector: { auth_asym_id: 'A', auth_seq_id: 201 },
  custom: {
    molstar_show_non_covalent_interactions: true,
    molstar_non_covalent_interactions_radius_ang: 5,
  },
});`,
      ],
    ),
    edit(
      'Label the P-loop tyrosine',
      'Y253 sits in the P-loop that closes over the drug. Add a label to it with one more component.',
      POCKET,
      [
        '// Labels\n',
        "// Labels\nstructure\n  .component({ selector: { auth_asym_id: 'A', auth_seq_id: 253 } })\n  .label({ text: 'Y253 P-loop' });\n",
      ],
    ),
  ],
};
