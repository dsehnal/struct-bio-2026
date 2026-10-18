/**
 * Copyright (c) 2026 mol* contributors, licensed under MIT, See LICENSE file for more info.
 *
 * Developed in collaboration with Anyfold <https://anyfold.ai/>
 *
 * @author David Sehnal <david.sehnal@gmail.com>
 */

import { markKeys } from './data-files.js';
import { type CodeLanguage, highlight } from './highlight.js';
import { escapeHtml, notes, slide, stage } from './html.js';

// The principle slides: short, static, one picture or one code pair each (outline.md "Principles"). They sit in parts 2, 3
// and 6 where they belong; the parts call them.

/** A labelled code box; `code` is the text, highlighted as `language`. */
function codePanel(label: string, code: string, language: CodeLanguage | 'plain', className = ''): string {
  const html = language === 'plain' ? escapeHtml(code) : highlight(code, language);
  return `<div class="stack panel"><span class="code-label">${escapeHtml(label)}</span><pre class="code plain ${className}"><code>${html}</code></pre></div>`;
}

// --- part 2: state, not steps ----------------------------------------------------------------------------------------------

const Clicks = [
  'Home → open by PDB ID',
  'Type 1IEP',
  'Apply, wait for the download',
  'Open the Structure panel',
  'Select the polymer component',
  'Open its menu',
  'Representation: Cartoon',
  'Open Color',
  'Choose Uniform',
  'Pick a gray',
  'Components → Add',
  'Pick Ligand',
  'Name it STI',
  'Representation: Ball & Stick',
  'Color: Element symbol',
  'Open Selection mode',
  'Click residue T315',
  'Add to selection',
  'Labels → Add',
  'Type T315, choose a size',
  'Color the selection',
  'Pick red',
  'Open Canvas settings',
  'Background: white',
  'Rotate the view',
  'Zoom in',
  'Add a snapshot',
  'Open Export',
  'Image, then PNG',
  'Save the session, if you remember',
];

const StateCode = `const s = builder
  .download({ url: '…/1iep.bcif' })
  .parse({ format: 'bcif' })
  .modelStructure();
s.component({ selector: { auth_asym_id: 'A' } })
  .representation({ type: 'cartoon' })
  .color({ color: 'lightgray' });
s.component({ selector: 'ligand' })
  .representation({ type: 'ball_and_stick' });`;

export function stateNotSteps(part: number): string {
  const lines = StateCode.split('\n').length;
  return slide({
    part,
    notes: notes(
      'Principle: <strong>state, not steps</strong>. The same figure, 1IEP with the protein in gray and imatinib as sticks, two ways.',
      'On the left, what you do in a classic UI: about thirty clicks, each one a step. If you want the figure again tomorrow, or want a colleague to make the same one, you have to remember or write down the steps, and the order matters.',
      `On the right, the description: ${lines} lines that say what the figure <em>is</em>. It is a state, not a recipe. A state can be <strong>replayed</strong> (load it again and get the same figure), <strong>diffed</strong> (change the colour and the difference is one line in a text diff) and <strong>shared</strong> (it is a file, or a link).`,
    ),
    body: `
      <h2>State, not steps</h2>
      <p class="lead">The same figure: 1IEP, the protein gray, imatinib as sticks.</p>
      ${stage(`<div class="two-col">
        <div class="stack panel">
          <span class="code-label">THE CLASSIC UI: ABOUT 30 CLICKS, IN ORDER</span>
          <ol class="clicks">${Clicks.map((c) => `<li>${escapeHtml(c)}</li>`).join('')}</ol>
        </div>
        ${codePanel(`A DESCRIPTION: ${lines} LINES`, StateCode, 'ts')}
      </div>
      <div class="resources"><span>replay it</span><span>diff it</span><span>share it</span></div>`)}`,
  });
}

// --- part 3: one selection, many languages ----------------------------------------------------------------------------------

const SelPymol = `polymer.protein and
  byres (chain A within 5 of
         (chain A and resn STI))`;
const SelVmd = `same residue as
  (protein and chain A and
   within 5 of
   (chain A and resname STI))`;
const SelMolScript = `(structure-query.modifier.intersect-by
  :0 (structure-query.modifier.include-surroundings
    :0 (structure-query.generator.atom-groups
      :residue-test (core.rel.eq
        (…label_comp_id) STI))
    :radius 5
    :as-whole-residues true)
  :by (structure-query.generator.atom-groups
    :chain-test (core.rel.eq
      (…auth_asym_id) A)))`;
const SelBuilder = `const MS = MolScriptBuilder;
const ligand = MS.struct.generator.atomGroups({
  'residue-test': MS.core.rel.eq([
    MS.ammp('label_comp_id'), 'STI']),
});
const pocket = MS.struct.modifier.includeSurroundings({
  0: ligand, radius: 5, 'as-whole-residues': true,
});`;

export function selectionLanguages(part: number): string {
  return slide({
    part,
    notes: notes(
      'Principle: <strong>one selection, many languages</strong>. The question is the same: the residues of chain A of 1IEP within 5 Å of imatinib, the pocket.',
      '- In <strong>PyMOL</strong> it is a line you may already have in a script.',
      '- In <strong>VMD</strong> the same idea reads differently: <code>same residue as … within 5 of …</code>.',
      '- The <strong>MolScript</strong> S-expression is what Mol* uses underneath: a tree of named symbols. It is verbose on purpose: it is exact, and it can be stored and checked.',
      '- The <strong>builder</strong> writes the same tree in code.',
      "PyMOL, VMD and Jmol text is compiled into that tree. So what you already know keeps working, and in a description the selection means the same in every viewer. In MolViewSpec you write it as <code>molql('…')</code>, as in the last component of the selectors slide.",
      'This slide is static: the compiled forms differ in detail, such as how each language treats "protein", but they are all the same kind of thing.',
    ),
    body: `
      <h2>One selection, many languages</h2>
      <p class="lead">Residues of chain A within 5 Å of imatinib (1IEP). Each compiles to the same MolQL tree.</p>
      <div class="grid2">
        ${codePanel('PYMOL', SelPymol, 'plain')}
        ${codePanel('VMD', SelVmd, 'plain')}
        ${codePanel('MOLSCRIPT S-EXPRESSION', SelMolScript, 'plain')}
        ${codePanel('MVS BUILDER · MOLQL IN CODE', SelBuilder, 'ts')}
      </div>`,
  });
}

// --- part 3: data stays outside the structure -------------------------------------------------------------------------------

const AnnotationExample = JSON.stringify(
  [
    { auth_asym_id: 'B', auth_seq_id: 248, class: 'contact', color: '#d1495b', label: 'R248' },
    { auth_asym_id: 'B', auth_seq_id: 175, class: 'structural', color: '#00798c', label: 'R175' },
  ],
  undefined,
  1,
);

const Granularity: readonly { schema: string; keys: string }[] = [
  { schema: 'auth_residue', keys: 'auth_asym_id, auth_seq_id' },
  { schema: 'residue', keys: 'label_asym_id, label_seq_id' },
  { schema: 'auth_residue_range', keys: 'auth_asym_id, beg_auth_seq_id, end_auth_seq_id' },
  { schema: 'residue_range', keys: 'label_asym_id, beg_label_seq_id, end_label_seq_id' },
  { schema: 'auth_atom', keys: 'auth_asym_id, auth_seq_id, auth_atom_id' },
  { schema: 'atom', keys: 'label_asym_id, label_seq_id, label_atom_id' },
];

export function dataOutside(part: number): string {
  return slide({
    part,
    notes: notes(
      'Principle: <strong>data stays outside the structure</strong>. Your scores, variants or conservation do not belong in the structure file, and you should not edit it.',
      'An annotation is a small table, JSON or CIF, in which every row has <strong>keys</strong> that say where it applies, and <strong>values</strong>: a colour, a text, a number. The highlighted columns are the keys: chain and residue number. The rest are values you choose.',
      "The description joins the table to the structure by those keys. The <code>schema</code> says what the keys mean, and so the granularity: a whole residue, a range of residues, or a single atom, in the author's numbering (<code>auth_</code>) or the file's own (<code>label_</code>). Also available: a chain, an entity, the whole structure, and all atoms.",
      'Next slide: the same table on a structure, with the code that reads it. Open the Data tab there to see the file.',
    ),
    body: `
      <h2>Data stays outside the structure</h2>
      <p class="lead">A table of rows: keys say where, values say what. The description joins them.</p>
      ${stage(`<div class="two-col">
        <div class="stack panel">
          <span class="code-label">AN ANNOTATION FILE (JSON; CIF WORKS TOO)</span>
          <pre class="code plain"><code>${markKeys(highlight(AnnotationExample, 'json'))}</code></pre>
          <p class="lead">Highlighted: the keys. The rest: values to show.</p>
        </div>
        <div class="stack panel">
          <span class="code-label">THE SCHEMA SETS THE GRANULARITY</span>
          <table class="schema">${Granularity.map((g) => `<tr><td><code>${g.schema}</code></td><td>${g.keys}</td></tr>`).join('')}</table>
          <p class="lead">Also: <code class="inline-code">chain</code>, <code class="inline-code">entity</code>, <code class="inline-code">whole_structure</code>, <code class="inline-code">all_atomic</code>.</p>
        </div>
      </div>`)}`,
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
