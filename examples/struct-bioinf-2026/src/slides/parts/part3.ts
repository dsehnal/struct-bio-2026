/**
 * Copyright (c) 2026 mol* contributors, licensed under MIT, See LICENSE file for more info.
 *
 * Developed in collaboration with Anyfold <https://anyfold.ai/>
 *
 * @author David Sehnal <david.sehnal@gmail.com>
 */

import { getSnippet } from '../../examples/index.js';
import { highlight } from '../highlight.js';
import { link, notes, slide, stage } from '../html.js';
import { Links } from '../links.js';
import { checkedNotGuessed, dataOutside, numbering, selectionLanguages } from '../principles.js';
import { snippetSlide } from '../snippet.js';
import { opener } from './opener.js';

// Part 3, MolViewSpec, with example A: p53 (outline.md §3, 8 min).

const PythonCode = `from molviewspec import create_builder

url = "https://www.ebi.ac.uk/pdbe/entry-files/download/1cbs.bcif"
builder = create_builder()
(
    builder.download(url=url)
    .parse(format="bcif")
    .model_structure()
    .component(selector="polymer")
    .representation(type="cartoon")
    .color(color="teal")
)
state = builder.get_state()  # the same tree`;

const FallbackTypeScript = `builder
  .download({ url: 'https://www.ebi.ac.uk/pdbe/entry-files/download/1cbs.bcif' })
  .parse({ format: 'bcif' })
  .modelStructure()
  .component({ selector: 'polymer' })
  .representation({ type: 'cartoon' })
  .color({ color: 'teal' });`;

export function part3(): string {
  // The TypeScript side is the first snippet of the deck, without its comment line.
  const typescript = (getSnippet('basics-smallest')?.code ?? FallbackTypeScript)
    .split('\n')
    .filter((line) => !line.startsWith('//'))
    .join('\n')
    .trim();
  return [
    opener({
      part: 3,
      title: 'MolViewSpec',
      time: '11–19 min, with example A: p53',
      points: [
        '<strong>The tree</strong>: the smallest scene in 8 lines',
        '<strong>Selectors</strong>: chains, ranges, MolQL',
        '<strong>Annotations from a file</strong>: your data on a structure',
        '<strong>Primitives</strong>: labels, arrows, distances, boxes',
        '<strong>Python or TypeScript</strong>, and <strong>portability</strong>',
      ],
      notes: notes(
        'MolViewSpec, in about eight minutes. Principles, one slide each, each with a snippet that runs beside the code. After the principles, example A: p53.',
        'On the map: MolViewSpec is the 3D description in the middle. It takes data from PDBe, AlphaFold DB and annotation files, and it is drawn by Mol* and Prism, or a notebook.',
        'The slides are live: the code is on the left, the viewer on the right runs it, and the "Try it" chip opens the same snippet in the playground.',
      ),
    }),

    snippetSlide({
      part: 3,
      snippetId: 'basics-smallest',
      title: 'The tree: the smallest scene',
      lead: 'Download, parse, structure, component, representation, color.',
      notes: notes(
        'Principle 1, the tree. The smallest scene: download a file, parse it, make a structure, pick a component, give it a representation and a colour. About 8 lines of builder code.',
        'Click the second tab: this is the MVSJ the code produced. It is the actual description, plain JSON. The code is only a convenient way to write it. You could write the JSON by hand, or generate it from Python, or have an assistant write it.',
        'Everything else today is more nodes in this tree.',
      ),
    }),

    snippetSlide({
      part: 3,
      snippetId: 'basics-selectors',
      title: 'Components and selectors',
      lead: 'Chains, residue ranges, kinds of molecule, and a selection written as text.',
      notes: notes(
        'Principle 2, components and selectors. A component is a part of the structure you want to treat as a unit: a chain, a range of residues, "ligand", "polymer", "nucleic".',
        'Chain ids and residue numbers here are the ones in the file, <code>auth_asym_id</code> and <code>auth_seq_id</code>, the same numbers you see in the PDB entry.',
        "The last component is a MolQL selection written in PyMOL syntax: <code>molql('chain B and resn ZN')</code>. It is compiled to MolQL, so it means the same thing in every viewer.",
        'This is p53 on DNA, 1TSR. We will use it again in example A.',
      ),
    }),

    selectionLanguages(3),

    dataOutside(3),

    snippetSlide({
      part: 3,
      snippetId: 'basics-annotations',
      title: 'Annotations from a file',
      lead: 'Colours and tooltips from a small table of residues, kept apart from the code.',
      notes: notes(
        'Principle 3, annotations from a file. <code>colorFromUri</code> and <code>tooltipFromUri</code> read a CIF or JSON table with per-residue values.',
        'This is how you put <strong>your own data</strong> on a structure without touching the structure file: variants, conservation, scores, anything with a residue number.',
        'Here the file lists key residues of the ABL kinase with a colour and a text for each. Hover a residue: the tooltip is from the file. Open the <strong>Data</strong> tab: that is the file. The highlighted keys, chain and residue number, join each row to the structure. Change the file, and the picture changes; the code stays the same.',
      ),
    }),

    snippetSlide({
      part: 3,
      snippetId: 'basics-primitives',
      title: 'Primitives',
      lead: 'Labels, a measured distance and a box: the "look here" part of a figure.',
      notes: notes(
        'Principle 4, primitives. Labels, arrows, distances, boxes: the "point at this" part of a figure. They are in the description too, so the figure is complete in the file, not drawn afterwards in a slide editor.',
        'Positions can be a residue, so you do not need coordinates. The distance label is computed.',
      ),
    }),

    slide({
      part: 3,
      notes: notes(
        'Principle 5, Python or TypeScript. The same builder exists in Python as <code>molviewspec</code>, so you can build a scene in a notebook from your own analysis, say a table of scores from your pipeline, and the viewer in the notebook shows it.',
        'The code on the slide is the same scene on both sides. Same steps, same names; Python uses snake_case.',
        'The talk and the playground use TypeScript, because it runs in the browser with nothing to set up, and the editor completes and checks it as you type. If you prefer Python, open the default Colab notebook (the link is on the slide and in the chat).',
        'SeqViewSpec has no Python builder yet; it may get one later.',
      ),
      foot: `<a class="chip" href="${Links.colab}" target="_blank" rel="noopener">Open the Colab notebook</a>`,
      body: `
        <header class="slide-head">
          <h2>Python or TypeScript</h2>
          <p class="lead">The same builder in both. In a notebook, build a scene from your own analysis: ${link(Links.colab, 'default Colab notebook')}.</p>
        </header>
        <div class="code-pair">
          <div class="stack"><span class="code-label">TYPESCRIPT · molviewspec builder, the playground</span><pre class="code"><code>${highlight(typescript, 'ts')}</code></pre></div>
          <div class="stack"><span class="code-label">PYTHON · molviewspec, a notebook</span><pre class="code"><code>${highlight(PythonCode, 'py')}</code></pre></div>
        </div>`,
    }),

    slide({
      part: 3,
      notes: notes(
        'Principle 6, portability. A description is a file, so it travels.',
        '- <strong>.mvsx</strong>: the description with its data in one file, for a supplement or an archive.',
        '- <strong>Embed</strong>: put it in any page with the viewer: one call to create the viewer, one to load the description. The playground is such a page.',
        '- <strong>mvs-render</strong>: a command-line tool renders a description to an image, for a figure in a paper or for a pipeline, with no browser to click in.',
        'The same description, a figure for the paper and an interactive view for the reader.',
      ),
      body: `
        <h2>Portability</h2>
        <p class="lead">A description is a file, so the same one goes everywhere.</p>
        ${stage(`<div class="cards">
          <div class="card"><h3>A file</h3><p>Save it as <code class="inline-code">.mvsx</code>, the description with its data, for a supplement or an archive.</p><div class="mini-code">scene.mvsx</div></div>
          <div class="card"><h3>A web page</h3><p>Embed the viewer and load the description: one call each.</p><div class="mini-code">viewer.api.load.mvs({ data })</div></div>
          <div class="card"><h3>An image</h3><p>Render it from the command line, for a figure or a pipeline.</p><div class="mini-code">mvs-render -i scene.mvsj -o scene.png</div></div>
        </div>`)}`,
    }),

    slide({
      part: 3,
      notes: notes(
        'Example A, p53: from sequence to variant. It builds on AlphaFold DB (Wednesday), Missense3D (Thursday) and the disorder talk after lunch.',
        'Three views, three slides. First the AlphaFold model coloured by confidence: a confident DNA-binding domain, a tetramerisation helix and long disordered ends. Then the DNA-binding domain on DNA in 1TSR. Then the cancer hotspots from a file: <strong>contact</strong> mutants (R248, R273) touch the DNA; <strong>structural</strong> mutants (R175, G245, R249, R282) hold the fold.',
        'The numbering of 1TSR is the UniProt numbering, so the same annotation file works on the AlphaFold model and on 1TSR.',
      ),
      body: `
        <h2>Example A: p53, from sequence to variant</h2>
        <p class="lead">Three views of one protein, the tumour suppressor mutated in many cancers.</p>
        ${stage(`<div class="cards">
          <div class="card"><h3>1 · Confidence</h3><p>The AlphaFold model coloured by pLDDT: a confident DNA-binding domain, a helix, disordered ends.</p></div>
          <div class="card"><h3>2 · On DNA</h3><p>1TSR: the DNA-binding domain bound to its site, and the residues in contact.</p></div>
          <div class="card"><h3>3 · Hotspots</h3><p><span style="color:var(--slide-contact)">Contact</span> mutants touch the DNA, <span style="color:var(--slide-structural)">structural</span> mutants hold the fold.</p></div>
        </div>`)}`,
    }),

    snippetSlide({
      part: 3,
      snippetId: 'p53-af-plddt',
      title: 'p53 from AlphaFold, coloured by pLDDT',
      lead: 'Blue: confident. Orange: the model does not know. The ends are disordered.',
      notes: notes(
        "AF-P04637-F1, the AlphaFold model of human p53, coloured by pLDDT, the model's own confidence per residue. The colours are the four AlphaFold DB ones, read from the model file itself.",
        'What to see: a confident DNA-binding domain in the middle (dark blue), a tetramerisation helix, and orange, very low confidence, at the termini. That is intrinsic disorder, which is exactly what the talk after lunch is about.',
        'Try it: switch the representation from cartoon to surface.',
      ),
    }),

    numbering(3),

    snippetSlide({
      part: 3,
      snippetId: 'p53-dna',
      title: 'The DNA-binding domain on DNA (1TSR)',
      lead: 'Chain B is the copy on the consensus site. Red sticks: residues that touch the DNA.',
      notes: notes(
        '1TSR is the p53 core domain on DNA, by X-ray. Chain B is the copy bound to the consensus site; the other two copies make fewer, non-specific contacts, so they are faded.',
        'The red residues are a MolQL selection, written in PyMOL syntax: residues of chain B within 4 Å of the DNA. Say it in words, and it is a query, not a list somebody typed.',
        'Look for K120, R248, R273, R280, R283 on the DNA.',
        'Try it: change the distance, or change the chain.',
      ),
    }),

    snippetSlide({
      part: 3,
      snippetId: 'p53-hotspots',
      title: 'Cancer hotspots from a file',
      lead: 'Colour and tooltip come from the file: contact mutants (red) vs structural mutants (teal).',
      notes: notes(
        'Six cancer hotspots, in a small JSON file: R175, G245, R248, R249, R273, R282. Each row has a class, a colour and a tooltip.',
        '<strong>Contact</strong> mutants, R248 and R273, touch the DNA. <strong>Structural</strong> mutants, R175, G245, R249 and R282, do not touch it: they hold the fold, near the zinc site and in the loops and the H2 helix.',
        'This is the figure from your Missense3D session, as a description. The code only says how to draw; the data is in the file. Hover a residue for the tooltip, and open the Data tab to show the file.',
        'Try it: add R213 to the hotspots, or change the colours.',
      ),
    }),

    checkedNotGuessed(3),
  ].join('');
}
