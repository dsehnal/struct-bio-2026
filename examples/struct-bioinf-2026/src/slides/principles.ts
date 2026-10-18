/**
 * Copyright (c) 2026 mol* contributors, licensed under MIT, See LICENSE file for more info.
 *
 * Developed in collaboration with Anyfold <https://anyfold.ai/>
 *
 * @author David Sehnal <david.sehnal@gmail.com>
 */

import { type CodeLanguage, highlight } from './highlight.js';
import { escapeHtml, notes, slide, stage } from './html.js';

// The principle slides: short, static, one picture or one code pair each (outline.md "Principles"). They sit in parts 2, 3
// and 6 where they belong; the parts call them.

/** A labelled code box; `code` is the text, highlighted as `language`. */
function codePanel(label: string, code: string, language: CodeLanguage | 'plain', className = ''): string {
  const html = language === 'plain' ? escapeHtml(code) : highlight(code, language);
  return `<div class="stack panel"><span class="code-label">${escapeHtml(label)}</span><pre class="code plain ${className}"><code>${html}</code></pre></div>`;
}

// --- part 3: how a selection is written --------------------------------------------------------------------------------------

// One selection, the P-loop of ABL (1IEP chain A, L248–V256), three ways; checked on 1IEP: the MolScript and the PyMOL
// text select the same nine residues the range names.
const SelSchema = `structure.component({
  selector: {
    auth_asym_id: 'A',
    beg_auth_seq_id: 248,
    end_auth_seq_id: 256,
  },
});`;
const SelMolQL = `structure.component({
  selector: molql(\`(sel.atom.atom-groups
    :chain-test (= atom.auth_asym_id A)
    :residue-test (in-range
      atom.auth_seq_id 248 256))\`,
    'mol-script'),
});`;
const SelPymol = `structure.component({
  selector: pymol(
    'chain A and resi 248-256',
  ),
});`;

export function selectionLanguages(part: number): string {
  return slide({
    part,
    notes: notes(
      'How a selection is written. One selection, the P-loop of the ABL kinase in 1IEP, residues 248 to 256 of chain A, written three ways. All three select the same nine residues.',
      '- <strong>The schema</strong>: fields of the file, no language. A chain, a residue, a range, an atom, by auth or label ids (the numbering slide later), or the words <code>ligand</code>, <code>polymer</code>, <code>water</code>. The simplest, and the same keys the annotation files use.',
      '- <strong>MolQL</strong>: the selection language underneath, an S-expression of named symbols. Anything the schema cannot say goes here: distances, bonds, residue properties, "within 5 Å of the ligand". It is verbose on purpose: exact, stored as data, checked.',
      "- <strong>PyMOL text</strong>: what you already know, compiled to MolQL when the description is written. VMD and Jmol work the same way, through <code>molql(text, 'vmd')</code>.",
      'Whichever you write, the description stores the result: a schema selector, or a MolQL tree. So it means the same in every viewer.',
    ),
    body: `
      <h2>How a selection is written</h2>
      <p class="lead">The P-loop of ABL, residues 248–256 of chain A (1IEP): three ways, the same nine residues.</p>
      ${stage(`<div class="grid3">
        ${codePanel('THE SCHEMA · FIELDS OF THE FILE', SelSchema, 'ts')}
        ${codePanel('MOLQL · THE LANGUAGE UNDERNEATH', SelMolQL, 'ts')}
        ${codePanel('PYMOL TEXT · COMPILED TO MOLQL', SelPymol, 'ts')}
      </div>
      <ul class="points small">
        <li><strong>Schema</strong>: chains, residues, ranges, atoms; <code class="inline-code">ligand</code>, <code class="inline-code">polymer</code>. The simplest.</li>
        <li><strong>MolQL</strong>: anything: distances, bonds, properties.</li>
        <li><strong>PyMOL</strong> (or VMD, Jmol): what you know, stored as MolQL.</li>
      </ul>`)}`,
  });
}

// --- part 3: data stays outside the structure -------------------------------------------------------------------------------

/** What "chain A, 111–250" leaves open, and the MVS selector key that answers it (`ComponentExpressionT`, param-types.ts). */
const Addressing: readonly { question: string; example: string; key: string; plain?: boolean }[] = [
  { question: 'Whose numbering?', example: "the authors' or the file's own", key: 'auth_seq_id · label_seq_id' },
  { question: 'Which chain name?', example: 'auth A is label C in 1TSR', key: 'auth_asym_id · label_asym_id' },
  { question: 'Inserted residues?', example: '52, 52A, 52B', key: 'pdbx_PDB_ins_code' },
  { question: 'Which copy?', example: 'assemblies, crystal symmetry', key: "instance_id ('ASM-X0-1', '1_555')" },
  { question: 'Which molecule?', example: 'a ligand, a sugar, water', key: 'label_entity_id · label_comp_id' },
  { question: 'Which atom?', example: 'the hydroxyl of T315', key: 'label_atom_id · type_symbol · atom_id' },
  {
    question: 'Which sequence?',
    example: 'UniProt vs PDB positions',
    key: 'a mapping (SIFTS); AlphaFold DB uses UniProt',
    plain: true,
  },
];

export function dataOutside(part: number): string {
  return slide({
    part,
    notes: notes(
      'Annotations, scores, variants, conservation: they live <strong>outside</strong> the structure file, and you should not edit the file to add them. So the real question is how to <strong>link</strong> them to the structure: an addressing scheme.',
      'The naive address is "chain A, residues 111 to 250". It works for the simple case, and it is ambiguous everywhere else.',
      "- <strong>Whose numbering</strong>: the authors' (<code>auth_</code>, what papers use) or the file's own regular one (<code>label_</code>). The same residue has two numbers, and the same chain two names; the next slides show 1TSR, where auth A is label C.",
      '- <strong>Insertion codes</strong>: antibody numbering has 52, 52A, 52B. (MVS ranges do not take insertion codes yet; single residues do.)',
      '- <strong>Which copy</strong>: an assembly or crystal symmetry makes copies of the same chain, and they share its ids. <code>instance_id</code> tells them apart.',
      '- <strong>Which molecule</strong>: ligands, sugars and waters have no meaningful sequence position; entity and residue name address them.',
      '- <strong>Which atom</strong>: for contacts and distances you need atoms, by name, element or id.',
      '- <strong>Which sequence</strong>: UniProt positions are not PDB positions in general; SIFTS maps one onto the other. AlphaFold DB models use UniProt numbering, which is why the same p53 file works on the model and on 1TSR.',
      'In MolViewSpec an annotation file is a table whose key columns are exactly these fields, and its <code>schema</code> says which ones: residues, ranges, atoms, chains, entities, in auth or label terms. Next slide: such a file, with the Data tab open.',
    ),
    body: `
      <h2>Linking data to a structure</h2>
      <p class="lead">Annotations live outside the structure file. Linking them needs an address, and <code class="inline-code">A 111–250</code> is only the simple case.</p>
      ${stage(`<table class="addressing">
        <thead><tr><th>What the simple address leaves open</th><th>For example</th><th>The key in MolViewSpec</th></tr></thead>
        <tbody>${Addressing.map((a) => `<tr><td>${escapeHtml(a.question)}</td><td>${escapeHtml(a.example)}</td><td>${a.plain ? escapeHtml(a.key) : `<code>${escapeHtml(a.key)}</code>`}</td></tr>`).join('')}</tbody>
      </table>`)}`,
  });
}

// --- part 3: numbering ------------------------------------------------------------------------------------------------------

const Chains: readonly { what: string; auth: string; label: string }[] = [
  { what: 'p53, copy 1', auth: 'A', label: 'C' },
  { what: 'p53, copy 2', auth: 'B', label: 'D' },
  { what: 'p53, copy 3', auth: 'C', label: 'E' },
  { what: 'DNA, strand 1', auth: 'E', label: 'A' },
  { what: 'DNA, strand 2', auth: 'F', label: 'B' },
];

export function numbering(part: number): string {
  return slide({
    part,
    notes: notes(
      'A real pitfall for this audience: <strong>numbering</strong>. The same residue has more than one number, and a selector must say which.',
      "- <strong>auth</strong>: the author's chain names and residue numbers, the ones in the paper and on the PDB page. This is what you type.",
      "- <strong>label</strong>: the mmCIF file's own, regular chain ids and residue indices along the sequence.",
      "- <strong>UniProt</strong>: the numbering of the protein's sequence. SIFTS maps the PDB residues to UniProt.",
      'Look at 1TSR. The three p53 copies are chains A, B and C by auth, but C, D and E by label. The two DNA strands are E and F by auth, and A and B by label. So "chain A" means a protein in one world and a DNA strand in the other. That is why the selectors in this talk say <code>auth_asym_id</code> and <code>auth_seq_id</code>: they are the ones you read off the paper.',
      'The good news for p53: in 1TSR the auth residue numbers equal the UniProt numbers, so R248 is residue 248 in the PDB entry, in UniProt and in the AlphaFold model. That is why one annotation file works on both. It is not true for every entry: always check, and never mix auth and label in one selector.',
    ),
    body: `
      <h2>Numbering: auth, label and UniProt</h2>
      <p class="lead">The same chain has two names in one file. A selector says which it means: <code class="inline-code">auth_asym_id</code> or <code class="inline-code">label_asym_id</code>.</p>
      <div class="two-col center">
        <div class="stack panel">
          <span class="code-label">1TSR: CHAIN IDS</span>
          <table class="schema chains">
            <tr><th></th><th><code>auth_asym_id</code></th><th><code>label_asym_id</code></th></tr>
            ${Chains.map((c) => `<tr><td>${c.what}</td><td class="id">${c.auth}</td><td class="id">${c.label}</td></tr>`).join('')}
          </table>
        </div>
        <ul class="points small">
          <li><strong>auth</strong>: the authors' numbers, as in the paper and the PDB page. You type these.</li>
          <li><strong>label</strong>: the file's own, regular ids and indices.</li>
          <li><strong>UniProt</strong>: SIFTS maps PDB residues to it. In 1TSR the auth numbers <strong>equal</strong> UniProt's: R248 everywhere.</li>
          <li>Never mix <code>auth_</code> and <code>label_</code> in one selector.</li>
        </ul>
      </div>`,
  });
}

// --- part 3: checked, not guessed -------------------------------------------------------------------------------------------

const TypoCode = `builder
  .download({ url: 'https://…/1cbs.bcif' })
  .parse({ format: 'bcif' })
  .modelStructure()
  .component({ selector: 'polymer' })
  .representation({ type: 'cartoons' })
  .color({ colour: 'teal' });`;

export function checkedNotGuessed(part: number): string {
  return slide({
    part,
    notes: notes(
      'Principle: <strong>checked, not guessed</strong>. A description is validated before anything is drawn.',
      'Here are two typos: <code>cartoons</code> for <code>cartoon</code>, and <code>colour</code> for <code>color</code>. A viewer that guesses would draw a default and say nothing, and you would wonder why the figure is the wrong colour. A description that is checked says what is wrong and in which node.',
      'The error names the node, the parameter and the allowed values. In the playground the editor also underlines the line as you type, and the last good scene stays on screen.',
    ),
    body: `
      <h2>Checked, not guessed</h2>
      <p class="lead">A misspelled parameter or a wrong value is an error that names its node, not a silent default.</p>
      ${stage(`<div class="two-col">
        ${codePanel('A DESCRIPTION WITH TWO TYPOS', TypoCode, 'ts')}
        <div class="stack panel">
          <span class="code-label">WHAT YOU GET</span>
          <pre class="code plain error-box"><code>Invalid parameters for node of kind "representation":
  Invalid value for parameter "type":
  "cartoons" is not a valid value for literal type (…)

Invalid parameters for node of kind "color":
  Unknown parameter "colour".</code></pre>
          <p class="lead">The editor also underlines it at its line as you type, and the viewer keeps the last scene that worked.</p>
        </div>
      </div>`)}`,
  });
}

// --- part 6: snapshots and transitions --------------------------------------------------------------------------------------

const SnapshotCode = `const s1 = snapshot({
  title: '1. The map',
  description: 'The cryo-EM map…',
  duration_ms: 3000,
});
const s2 = snapshot({
  title: '2. The model in the map',
});
s2.transition({ duration_ms: 1500 });`;

export function snapshotsSlide(part: number): string {
  const card = (n: number, title: string, text: string) =>
    `<div class="snap"><span class="snap-n">${n}</span><strong>${escapeHtml(title)}</strong><span>${escapeHtml(text)}</span></div>`;
  return slide({
    part,
    notes: notes(
      'A story is made of <strong>snapshots</strong>. A snapshot is one complete state of the description: what is loaded, how it looks, where the camera is, plus a title and a text in Markdown, and how long to stay on it.',
      'Between two snapshots, a <strong>transition</strong> animates what changes: the camera moves, colours and visibility fade. You say how long it takes. So a story is a short list of states, and the viewer does the motion.',
      'On the right, how it reads in code: <code>snapshot(...)</code> makes one, <code>transition(...)</code> sets how the move into it looks. The next slide plays a real one, the spike.',
    ),
    body: `
      <h2>Snapshots and transitions</h2>
      <p class="lead">A story is a list of whole states. The viewer animates the move between them.</p>
      ${stage(`<div class="stack panel">
          <div class="snaps">${card(1, 'The map', 'camera · text · 3 s')}<span class="snap-arrow">→<small>transition 1.5 s</small></span>${card(2, 'The model in the map', 'camera · text · 3 s')}<span class="snap-arrow">→<small>transition</small></span>${card(3, 'The glycan shield', 'camera · text · 3 s')}</div>
        </div>
        ${codePanel('IN CODE', SnapshotCode, 'ts')}`)}`,
  });
}
