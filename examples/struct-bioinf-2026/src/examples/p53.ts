/**
 * Copyright (c) 2026 mol* contributors, licensed under MIT, See LICENSE file for more info.
 *
 * Developed in collaboration with Anyfold <https://anyfold.ai/>
 *
 * @author David Sehnal <david.sehnal@gmail.com>
 */

import { edit } from './edit.js';
import type { Example } from './types.js';

// Example A, p53 (outline.md §3-§4). Every chain, residue and range is a checked fact (_spec/examples.md A); the
// hotspots are in public/data/p53-hotspots.json. Code lines stay under 68 characters (the editor's width).

const AF_PLDDT = `// p53 as AlphaFold predicted it, coloured by pLDDT: the model's own
// confidence in each residue.
const model = builder
  .download({
    url: 'https://alphafold.ebi.ac.uk/files/AF-P04637-F1-model_v6.bcif',
  })
  .parse({ format: 'bcif' })
  .modelStructure();

model
  .component({ selector: 'polymer' })
  .representation({ type: 'cartoon' })
  // The file stores pLDDT for every residue; these are the four
  // colours of AlphaFold DB.
  .colorFromSource({
    schema: 'residue',
    category_name: 'ma_qa_metric_local',
    field_name: 'metric_value',
    palette: {
      kind: 'discrete',
      mode: 'absolute',
      colors: [
        ['#FF7D45', null, 50], // very low
        ['#FFDB13', 50, 70], // low
        ['#65CBF3', 70, 90], // confident
        ['#0053D6', 90, null], // very high
      ],
    },
  });
`;

const AF_DOMAIN = `// The DNA-binding domain (residues 102 to 292) as it is, the rest of
// the model see-through. pLDDT colours all of it.
const model = builder
  .download({
    url: 'https://alphafold.ebi.ac.uk/files/AF-P04637-F1-model_v6.bcif',
  })
  .parse({ format: 'bcif' })
  .modelStructure();

// The colours as a function, so that each part can use them
const byPlddt = (drawing: MVSRepresentation) =>
  drawing.colorFromSource({
    schema: 'residue',
    category_name: 'ma_qa_metric_local',
    field_name: 'metric_value',
    palette: {
      kind: 'discrete',
      mode: 'absolute',
      colors: [
        ['#FF7D45', null, 50],
        ['#FFDB13', 50, 70],
        ['#65CBF3', 70, 90],
        ['#0053D6', 90, null],
      ],
    },
  });

// A range of residues of the model, as a cartoon
const part = (beg: number, end: number) =>
  model
    .component({
      selector: {
        label_asym_id: 'A',
        beg_label_seq_id: beg,
        end_label_seq_id: end,
      },
    })
    .representation({ type: 'cartoon' });

byPlddt(part(102, 292));

// The two ends: before the domain, and after it
byPlddt(part(1, 101)).opacity({ opacity: 0.25 });
byPlddt(part(293, 393)).opacity({ opacity: 0.25 });
`;

const DNA = `// p53's core domain on DNA (1TSR): the copy bound to the DNA site,
// and what it touches.
const structure = builder
  .download({
    url: 'https://www.ebi.ac.uk/pdbe/entry-files/download/1tsr.bcif',
  })
  .parse({ format: 'bcif' })
  .modelStructure();

// Chain B is the p53 copy on the consensus site; E and F are the two
// strands of DNA.
structure
  .component({ selector: { auth_asym_id: 'B' } })
  .representation({ type: 'cartoon' })
  .color({ color: 'steelblue' });
structure
  .component({ selector: 'nucleic' })
  .representation({ type: 'cartoon' })
  .color({ color: 'goldenrod' });

// The other two copies make fewer, non-specific contacts: faded.
structure
  .component({
    selector: [{ auth_asym_id: 'A' }, { auth_asym_id: 'C' }],
  })
  .representation({ type: 'cartoon' })
  .color({ color: 'lightgray' })
  .opacity({ opacity: 0.25 });

// Residues of chain B with an atom within 4 Å of the DNA, as sticks.
const touching = structure.component({
  selector: molql(
    'chain B and polymer.protein and ' +
      'byres ((chain B and polymer.protein) within 4 of polymer.nucleic)',
  ),
});
touching
  .representation({ type: 'ball_and_stick' })
  .color({ color: 'tomato' });
touching.focus({ radius_factor: 2.2 });
`;

const HOTSPOTS = `// p53's cancer hotspots on the DNA-bound core domain (1TSR, chain B).
// Which residue is a hotspot, its class and its tooltip are in a file
// (public/data/p53-hotspots.json); the code says how to draw them.
const table = {
  uri: asset('p53-hotspots.json'),
  format: 'json',
  schema: 'auth_residue',
} as const;

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
structure
  .component({ selector: 'nucleic' })
  .representation({ type: 'cartoon' })
  .color({ color: 'goldenrod' });

// Every residue the file lists, coloured by the file's class column:
// contact mutants touch the DNA, structural mutants hold the fold.
const hotspots = structure.componentFromUri(table);
hotspots.representation({ type: 'ball_and_stick' }).colorFromUri({
  ...table,
  field_name: 'class',
  palette: {
    kind: 'categorical',
    colors: { contact: '#d1495b', structural: '#00798c' },
  },
});
hotspots.focus({ radius_factor: 2 });

// Hover a hotspot for the file's text; each one also gets a label.
structure.tooltipFromUri({ ...table, field_name: 'tooltip' });
structure.labelFromUri({ ...table, field_name: 'label' });
`;

// Seq* (outline.md §4). The AlphaFold model of P04637 is the structure; its chain has UniProt's numbering (label ids).
// The tracks are inline tables of ranges: the regions of UniProt's P04637 entry and the hotspots (examples.md A).
const SEQUENCE = `// The sequence of p53 (UniProt P04637) as a description of its own:
// regions, hotspots and AlphaFold's confidence, linked to the model in
// 3D. Hover a residue in the sequence and it lights up in the model.
const model = seq.data.complex({
  ref: 'model',
  provider: 'molstar:structure',
  source: {
    service: 'afdb',
    resource: 'structure',
    id: 'AF-P04637-F1',
  },
});
const chain = model.unit('A');

// A table of ranges, in the numbering of UniProt (which is the label
// numbering of the model): where the regions are.
const regions = seq.data.annotation({
  ref: 'regions',
  geometry: 'ranges',
  target: chain,
  numbering: 'label',
  value: [
    { beg: 1, end: 44, label: 'Activation', category: 'domain' },
    { beg: 102, end: 292, label: 'DNA-binding', category: 'domain' },
    { beg: 305, end: 321, label: 'NLS', category: 'signal' },
    { beg: 325, end: 356, label: 'Oligomerisation', category: 'domain' },
    { beg: 368, end: 387, label: 'Basic C-term', category: 'region' },
  ],
});
const motifs = seq.data.annotation({
  ref: 'motifs',
  geometry: 'ranges',
  target: chain,
  numbering: 'label',
  value: [
    { beg: 17, end: 25, label: 'TADI', category: 'motif' },
    { beg: 48, end: 56, label: 'TADII', category: 'motif' },
  ],
});
const disordered = seq.data.annotation({
  ref: 'disordered',
  geometry: 'ranges',
  target: chain,
  numbering: 'label',
  value: [
    { beg: 50, end: 96, label: 'Disordered', category: 'disorder' },
    { beg: 351, end: 393, label: 'Disordered', category: 'disorder' },
  ],
});

// The hotspots: contact mutants touch the DNA, structural ones hold
// the fold.
const hotspots = seq.data.annotation({
  ref: 'hotspots',
  geometry: 'ranges',
  target: chain,
  numbering: 'label',
  value: [
    { beg: 175, end: 175, label: 'R175', category: 'structural' },
    { beg: 245, end: 245, label: 'G245', category: 'structural' },
    { beg: 248, end: 248, label: 'R248', category: 'contact' },
    { beg: 249, end: 249, label: 'R249', category: 'structural' },
    { beg: 273, end: 273, label: 'R273', category: 'contact' },
    { beg: 282, end: 282, label: 'R282', category: 'structural' },
  ],
});

// The model's confidence for each residue, read from the structure
const plddt = seq.data.computed({
  ref: 'plddt',
  provider: 'molstar:plddt',
  options: { of: model },
});

// One view with one section; each track is a row under the sequence
const section = seq.view({ label: 'p53' }).section({ style: 'compact' });
section.track({ label: '' }).ruler();
section.track({ label: 'Sequence' }).letters();
section.track({ label: 'Regions' }).ranges({ data: regions, labels: true });
section.track({ label: 'Motifs' }).ranges({ data: motifs, labels: true });
section.track({ label: 'Disordered' }).ranges({ data: disordered });
section.track({ label: 'Hotspots' }).points({
  data: hotspots,
  color: {
    theme: 'field_palette',
    params: {
      field: 'category',
      palette: {
        kind: 'categorical',
        colors: { contact: '#d1495b', structural: '#00798c' },
      },
    },
  },
});
section.track({ label: 'pLDDT' }).values({ data: plddt });
`;

export const P53Example: Example = {
  id: 'p53',
  title: 'p53',
  tagline: 'From sequence to variant: confidence, DNA, hotspots.',
  snippets: [
    {
      id: 'p53-af-plddt',
      kind: 'mvs',
      title: 'AlphaFold model, coloured by pLDDT',
      summary:
        "A confident DNA-binding domain, a tetramerisation helix and long disordered ends: the colours are the model's own confidence.",
      code: AF_PLDDT,
    },
    {
      id: 'p53-dna',
      kind: 'mvs',
      title: 'The core domain on DNA',
      summary: 'The p53 copy bound to the DNA site, and the residues of it that touch the DNA.',
      code: DNA,
      edits: [
        edit(
          'A wider reach',
          'Change the distance from 4 to 6 Å to include residues that are close to the DNA but do not touch it.',
          DNA,
          ['within 4 of', 'within 6 of'],
        ),
        edit(
          'Draw the surface of the protein',
          'Add a component that draws chain B as a see-through surface. The sticks that touch the DNA show through it.',
          DNA,
          [
            '// Residues of chain B with an atom',
            `structure
  .component({ selector: { auth_asym_id: 'B' } })
  .representation({ type: 'surface' })
  .color({ color: 'steelblue' })
  .opacity({ opacity: 0.3 });

// Residues of chain B with an atom`,
          ],
        ),
        edit(
          'Name the two arginines',
          'Components can carry a label. Add labels to R248 and R273, the two hotspots that touch the DNA.',
          DNA,
          [
            'touching.focus({ radius_factor: 2.2 });\n',
            `touching.focus({ radius_factor: 2.2 });

for (const n of [248, 273]) {
  structure
    .component({ selector: { auth_asym_id: 'B', auth_seq_id: n } })
    .label({ text: 'R' + n });
}
`,
          ],
        ),
      ],
    },
    {
      id: 'p53-hotspots',
      kind: 'mvs',
      title: 'Cancer hotspots from a file',
      summary:
        'Six hotspots on the DNA-bound domain, coloured by class: contact mutants touch the DNA, structural mutants hold the fold. The file supplies the residues and the tooltips.',
      code: HOTSPOTS,
      edits: [
        edit(
          'Change a colour',
          'The colours of the two classes are in the code. Replace the red of the contact mutants with orange.',
          HOTSPOTS,
          ["contact: '#d1495b'", "contact: 'orange'"],
        ),
        edit(
          'Only the contact mutants',
          "The component takes the rows of the file whose value is in a list. Give it just 'contact' to hide the structural ones.",
          HOTSPOTS,
          [
            'structure.componentFromUri(table);',
            "structure.componentFromUri({\n  ...table,\n  field_name: 'class',\n  field_values: ['contact'],\n});",
          ],
        ),
        edit(
          'Add a residue the file does not list',
          'A hotspot of your own, in code: K120 of chain B touches the DNA too. Give it a component, sticks and a label.',
          HOTSPOTS,
          [
            '// Hover a hotspot',
            `const k120 = structure.component({
  selector: { auth_asym_id: 'B', auth_seq_id: 120 },
});
k120.representation({ type: 'ball_and_stick' }).color({ color: 'orange' });
k120.label({ text: 'K120' });

// Hover a hotspot`,
          ],
        ),
      ],
    },
    {
      id: 'p53-sequence',
      kind: 'svs',
      title: 'The sequence of p53, linked to the model',
      summary:
        'Regions, hotspots and AlphaFold confidence along the sequence. Hover a residue and it lights up in the structure, and the other way round.',
      code: SEQUENCE,
      edits: [
        edit(
          'Add a region',
          'The Regions track is a table: one row per region. Add a row of your own, for example the core domain of the 1TSR structure, residues 94 to 289.',
          SEQUENCE,
          [
            "    { beg: 368, end: 387, label: 'Basic C-term', category: 'region' },",
            "    { beg: 368, end: 387, label: 'Basic C-term', category: 'region' },\n    { beg: 94, end: 289, label: '1TSR', category: 'region' },",
          ],
        ),
        edit(
          'Add a hotspot',
          'The hotspots are a table too. Add K120, a residue that touches the DNA, as a contact residue.',
          SEQUENCE,
          [
            "    { beg: 175, end: 175, label: 'R175', category: 'structural' },",
            "    { beg: 120, end: 120, label: 'K120', category: 'contact' },\n    { beg: 175, end: 175, label: 'R175', category: 'structural' },",
          ],
        ),
        edit('Hide the confidence track', 'Remove the last line to show the sequence without pLDDT.', SEQUENCE, [
          "section.track({ label: 'pLDDT' }).values({ data: plddt });\n",
          '',
        ]),
      ],
    },
  ],
  edits: [
    edit(
      'A different look',
      "Replace 'cartoon' with 'surface' to see the outside of the model. The colours stay: they belong to the residues, not to the picture.",
      AF_PLDDT,
      ["type: 'cartoon'", "type: 'surface'"],
    ),
    edit(
      'Only the DNA-binding domain',
      "Residues 102 to 292 are the DNA-binding domain. Replace 'polymer' with a range of residues to draw just that part.",
      AF_PLDDT,
      [
        "selector: 'polymer'",
        "selector: {\n      label_asym_id: 'A',\n      beg_label_seq_id: 102,\n      end_label_seq_id: 292,\n    }",
      ],
    ),
    {
      title: 'Fade what is not the domain',
      hint: 'Draw the domain as it is and the two ends see-through: three components, one per range, the ends with an opacity step.',
      code: AF_DOMAIN,
    },
  ],
};
