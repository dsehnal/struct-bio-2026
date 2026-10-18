/**
 * Copyright (c) 2026 mol* contributors, licensed under MIT, See LICENSE file for more info.
 *
 * Developed in collaboration with Anyfold <https://anyfold.ai/>
 *
 * @author David Sehnal <david.sehnal@gmail.com>
 */

import { edit } from './edit.js';
import type { Example } from './types.js';

// The smallest scenes (outline.md §3, principles 1-4): the tree, selectors, annotations from a file, primitives. The
// selectors and positions are 1TSR's facts (_spec/examples.md A) and 1IEP's (B); the files are in public/data. Code
// lines stay under 68 characters: the editor wraps, but wrapped code is harder to read.

const SMALLEST = `// Get the file, read it, make a structure, pick a part, draw it.
builder
  .download({
    url: 'https://www.ebi.ac.uk/pdbe/entry-files/download/1cbs.bcif',
  })
  .parse({ format: 'bcif' })
  .modelStructure()
  .component({ selector: 'polymer' })
  .representation({ type: 'cartoon' })
  .color({ color: 'teal' });
`;

const SMALLEST_LIGAND = `// The same scene, and the ligand (retinoic acid) as sticks.
const structure = builder
  .download({
    url: 'https://www.ebi.ac.uk/pdbe/entry-files/download/1cbs.bcif',
  })
  .parse({ format: 'bcif' })
  .modelStructure();

structure
  .component({ selector: 'polymer' })
  .representation({ type: 'cartoon' })
  .color({ color: 'teal' });

structure
  .component({ selector: 'ligand' })
  .representation({ type: 'ball_and_stick' });
`;

const SELECTORS = `// p53 core domain on DNA (1TSR). A selector says which part of the
// structure a component, or a colour, is for.
const structure = builder
  .download({
    url: 'https://www.ebi.ac.uk/pdbe/entry-files/download/1tsr.bcif',
  })
  .parse({ format: 'bcif' })
  .modelStructure();

// A whole chain, by its chain id in the file (auth_asym_id)
const chainB = structure
  .component({ selector: { auth_asym_id: 'B' } })
  .representation({ type: 'cartoon' })
  .color({ color: 'lightgray' });

// A range of residues of that chain: a colour for just that part
chainB.color({
  selector: {
    auth_asym_id: 'B',
    beg_auth_seq_id: 240,
    end_auth_seq_id: 250,
  },
  color: 'tomato',
});

// A named kind of molecule: all the DNA
structure
  .component({ selector: 'nucleic' })
  .representation({ type: 'cartoon' })
  .color({ color: 'goldenrod' });

// A selection written as text, in PyMOL's language: the zinc of chain B
structure
  .component({ selector: molql('chain B and resn ZN') })
  .representation({ type: 'spacefill' })
  .color({ color: 'purple' });
`;

const PYMOL = `// The pocket of imatinib in the ABL kinase (1IEP, chain A) as PyMOL
// text: pymol('...') turns a PyMOL selection into a selector.
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

// Residues of the protein with an atom within 5 Å of imatinib (STI)
const pocket = structure.component({
  selector: pymol('byres ((chain A and polymer) within 5 of resn STI)'),
});
pocket
  .representation({ type: 'ball_and_stick', size_factor: 0.6 })
  .color({ color: 'steelblue' });

// Imatinib itself
const drug = structure.component({
  selector: pymol('chain A and resn STI'),
});
drug.representation({ type: 'ball_and_stick' }).color({ color: 'orange' });
drug.focus({ radius_factor: 1.8 });
`;

const ANNOTATIONS = `// Imatinib's kinase (1IEP). The colours and the tooltips come from a
// small table in a file, not from this code. asset(...) is the address
// of a file of this page; the address of your own file works as well.
const table = {
  uri: asset('abl-key-residues.json'),
  format: 'json',
  schema: 'auth_residue',
} as const;

const structure = builder
  .download({
    url: 'https://www.ebi.ac.uk/pdbe/entry-files/download/1iep.bcif',
  })
  .parse({ format: 'bcif' })
  .modelStructure();

structure
  .component({ selector: { auth_asym_id: 'A' } })
  .representation({ type: 'cartoon' })
  .color({ color: 'lightgray' });

// The residues the table lists (chain and number), coloured by the
// table's colour column
const listed = structure.componentFromUri(table);
listed
  .representation({ type: 'ball_and_stick' })
  .colorFromUri({ ...table, field_name: 'color' });
listed.focus({ radius_factor: 2.5 });

// Hover a residue to see the table's text for it
structure.tooltipFromUri({ ...table, field_name: 'tooltip' });

// Imatinib is residue 201 of chain A
structure
  .component({ selector: { auth_asym_id: 'A', auth_seq_id: 201 } })
  .representation({ type: 'ball_and_stick' })
  .color({ color: 'orange' });
`;

const PRIMITIVES = `// Shapes and text to point at things: labels, a distance, a box.
// A position can be a residue; its middle is used.
const structure = builder
  .download({
    url: 'https://www.ebi.ac.uk/pdbe/entry-files/download/1tsr.bcif',
  })
  .parse({ format: 'bcif' })
  .modelStructure();

structure
  .component({ selector: { auth_asym_id: 'B' } })
  .representation({ type: 'cartoon' })
  .color({ color: 'lightgray' });

// Two arginines of chain B that touch the DNA
const r248 = { auth_asym_id: 'B', auth_seq_id: 248 };
const r273 = { auth_asym_id: 'B', auth_seq_id: 273 };
structure
  .component({ selector: [r248, r273] })
  .representation({ type: 'ball_and_stick' })
  .color({ color: 'tomato' });

const marks = structure.primitives({ color: 'black' });
marks.label({ position: r248, text: 'R248', label_size: 3 });
marks.label({ position: r273, text: 'R273', label_size: 3 });
marks.distance({
  start: r248,
  end: r273,
  label_template: '{{distance}} Å',
  radius: 0.15,
  dash_length: 0.4,
});

// A box around residue 175, with a tooltip
marks.box({
  center: { auth_asym_id: 'B', auth_seq_id: 175 },
  extent: [1, 1, 1],
  show_faces: false,
  show_edges: true,
  edge_color: 'steelblue',
  tooltip: 'R175, a structural hotspot',
});
`;

export const BasicsExample: Example = {
  id: 'basics',
  title: 'The smallest scene',
  tagline: 'Download, parse, draw: the ideas of a description.',
  snippets: [
    {
      id: 'basics-smallest',
      kind: 'mvs',
      title: 'Download, parse, cartoon',
      summary: 'A scene is a short chain of steps: get a file, read it, make a structure, pick a part, draw it.',
      code: SMALLEST,
    },
    {
      id: 'basics-selectors',
      kind: 'mvs',
      title: 'Selectors',
      summary:
        'Choose parts of the structure by chain, by residue range, by kind of molecule, or with a selection written as text.',
      code: SELECTORS,
      edits: [
        edit(
          'Another stretch of residues',
          'Change 240 and 250 to pick another stretch of chain B, for example 270 to 285.',
          SELECTORS,
          ['beg_auth_seq_id: 240', 'beg_auth_seq_id: 270'],
          ['end_auth_seq_id: 250', 'end_auth_seq_id: 285'],
        ),
        edit(
          'Select with text',
          'The text selection can say much more. Replace resn ZN with resn ZN or resn CYS to draw the zinc together with all the cysteines of chain B.',
          SELECTORS,
          ["molql('chain B and resn ZN')", "molql('chain B and (resn ZN or resn CYS)')"],
        ),
      ],
    },
    {
      id: 'basics-pymol',
      kind: 'mvs',
      title: 'PyMOL selectors',
      summary:
        'If you know PyMOL, write the selection the way you always do: the residues within 5 Å of imatinib, as text.',
      code: PYMOL,
      edits: [
        edit('A wider pocket', 'Change the distance from 5 to 8 Å to see what lies a little further out.', PYMOL, [
          'within 5 of',
          'within 8 of',
        ]),
        edit(
          'Only some residues',
          'PyMOL text can filter by residue name. Keep just the hydrophobic residues leucine, isoleucine, valine and phenylalanine of the pocket.',
          PYMOL,
          [
            "pymol('byres ((chain A and polymer) within 5 of resn STI)')",
            "pymol('byres ((chain A and polymer) within 5 of resn STI) and resn LEU+ILE+VAL+PHE')",
          ],
        ),
      ],
    },
    {
      id: 'basics-annotations',
      kind: 'mvs',
      title: 'Colours and tooltips from a file',
      summary:
        'Put your own data on a structure: a small table of residues, colours and texts, kept apart from the code.',
      code: ANNOTATIONS,
      edits: [
        edit(
          'Show the label as the tooltip',
          "Every row of the table has a short label as well. Hovering shows the tooltip column; change field_name from 'tooltip' to 'label' to show the label instead.",
          ANNOTATIONS,
          ["field_name: 'tooltip'", "field_name: 'label'"],
        ),
        edit(
          'Draw the residues as spheres',
          "Replace 'ball_and_stick' (the first one, for the listed residues) with 'spacefill'.",
          ANNOTATIONS,
          ["listed\n  .representation({ type: 'ball_and_stick' })", "listed\n  .representation({ type: 'spacefill' })"],
        ),
      ],
    },
    {
      id: 'basics-primitives',
      kind: 'mvs',
      title: 'Labels, distances and boxes',
      summary: 'Add shapes and text to point at things: a label, a measured distance and a box.',
      code: PRIMITIVES,
      edits: [
        edit(
          'Bigger labels',
          'Change the label size from 3 to 5 for both labels.',
          PRIMITIVES,
          ["text: 'R248', label_size: 3", "text: 'R248', label_size: 5"],
          ["text: 'R273', label_size: 3", "text: 'R273', label_size: 5"],
        ),
        edit(
          'Measure to another residue',
          'Move the second end of the distance: replace r273 with a position of your own, for example residue 282 of chain B.',
          PRIMITIVES,
          ['  start: r248,\n  end: r273,', "  start: r248,\n  end: { auth_asym_id: 'B', auth_seq_id: 282 },"],
        ),
      ],
    },
  ],
  edits: [
    edit(
      'Change the colour',
      'Replace teal with another colour name, for example tomato, gold or steelblue, then run.',
      SMALLEST,
      ["'teal'", "'tomato'"],
    ),
    edit(
      'Draw a surface',
      "Replace 'cartoon' with 'surface' to see the outside of the protein instead of its backbone.",
      SMALLEST,
      ["'cartoon'", "'surface'"],
    ),
    {
      title: 'Add the ligand',
      hint: 'A second component picks the ligand and draws it as sticks. Components are independent: each has its own look.',
      code: SMALLEST_LIGAND,
    },
  ],
};
