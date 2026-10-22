# The talk: outline

**Molecular visualisation for structural biology.** EMBL-EBI Structural bioinformatics 2026, Day five (Friday 23 October
2026), 11:00–12:00 BST, virtual (Zoom). The talk is followed by lunch, then the talks on disorder prediction (Erdős) and
MD (Harris).

## Audience

- About 35 scientists who use structural data. They know protein structure well and are not programmers.
- Earlier in the week they had PDBe and Mol\* (Tue), EMDB (Tue), PDBe-KB, AlphaFold DB, AlphaFill (Wed), Missense3D
  (Thu) and ChEMBL (Fri 09:00). So we skip "how to click in Mol\*" and build on those sessions: PDBe pages embed the
  viewer, EMDB maps, pLDDT/PAE, variants, ligands.
- They join over Zoom with their own browsers. Nothing to install: the playground is a URL.

## Message

How to use Mol* to show structures, sequences, maps and annotations. A scene can be written once as a short spec: what
to load, what to show, what it means. Then the same description runs in a web page, a notebook, a paper's supplement or
a story. Mol\* v6 provides the viewer (Prism), the descriptions (MolViewSpec for 3D, SeqViewSpec for sequences), the
selections (MolQL, SeqQL) and the data (volume server, annotations).

## Timing (≈45 min talk, ≈15 min questions)

| Min   | Part                                  | Mode                       |
| ----- | ------------------------------------- | -------------------------- |
| 0–2   | 0. Opening                            | slides                     |
| 2–9   | 1. The new viewer: Prism              | live in Prism              |
| 9–11  | 2. How it fits together               | slides (one diagram)       |
| 11–19 | 3. MolViewSpec + example A (p53)      | slides with live snippets  |
| 19–25 | 4. Sequences: Seq\*, SeqViewSpec      | slides with live snippets  |
| 25–30 | 5. Volumes + example B (imatinib)     | slides with live snippets  |
| 30–36 | 6. Stories, MolViewStories, example C | story playback, brief UI   |
| 36–40 | 7. Your turn: the playground          | link, one-click examples   |
| 40–60 | Questions                             | participants in playground |

The presenter goes fast, so the parts are tight. Each example slide has a "try it" chip that opens the same snippet in
the playground. Participants who follow along use it, and everyone else gets the playground in part 7 and during
questions. Each part has one fallback (a recording or a saved scene) in case the network or a server is slow.

## 0. Opening (2 min)

- Why visualise: to check a model against its evidence, to see a mechanism, to communicate it. The talk shows data and
  results, it does not compute them; the data comes from PDBe, EMDB, AFDB, UniProt, ChEMBL and other resources.
- The plan of the hour and the playground link (QR code + short URL), shown now and again in part 7.

## 1. The new viewer: Prism (7 min, live)

The participants know the classic Mol\* UI. Show what changes, not every feature. Demo in `apps/prism-viewer`:

1. **Home and loading**: open by PDB / AFDB / UniProt ID or by dropping a file. Use a recent entry.
2. **The command menu**: type what you want ("color by chain", "show ligand") instead of searching through panels.
3. **Targets as text**: `A:10-20`, `ligand`, a PyMOL selection; the same address language works everywhere (targets.md).
4. **Scene tree and inspector**: what is on screen, in plain words. Quick styles and presets.
5. **Sequence band (Seq\*)**: sequence under the 3D view, with hover and selection linked both ways. pLDDT and secondary
   structure as tracks.
6. **History**: every change is a step you can undo, and the session is kept in the browser (journal.md).
7. **Embedding**: one file and one call (`createPrismViewer`); the same viewer works headless for scripts and tests.

The idea to land: every button is an operation with a name and parameters. That is what makes part 2 possible: the UI
and scripts call the same operations.

Slide: classic UI vs Prism, one live box with both viewers cross-faded (a step and a slider), with 3–4 differences
named. Fallback: a 60 s recording of the demo.

## 2. How it fits together (2 min)

One diagram, used again as the map for the rest of the talk:

```
 data                      descriptions                 viewers
 PDBe / AFDB / EMDB  ─┐    MolViewSpec  (3D)    ─┐      Mol* / Prism (web)
 volume server        ├──▶ SeqViewSpec  (seq)    ├──▶   Seq* (sequences)
 annotations (CIF,    │    MolQL / SeqQL         │      notebooks (Python molviewspec)
   JSON, UniProt)    ─┘    (what to select)     ─┘      static images, stories, MVSX files
```

- A description is a tree: load → parse → structure → component → representation → color/label. It is data (JSON), not
  code, so it can be validated, saved, shared, diffed and generated.
- Selections are a language of their own (MolQL), so "residues within 5 Å of the ligand" means the same thing
  everywhere. PyMOL, VMD and Jmol syntax compile to it.

## 3. MolViewSpec, with example A: p53 (8 min)

Principles, one slide each with a runnable snippet (the slide's "Run" shows it beside the code):

1. **The tree**: the smallest scene (download → parse → structure → cartoon) in about 8 lines of builder code, with the
   MVSJ it produces next to it.
2. **Components and selectors**: chains, residue ranges, `ligand`, then a MolQL / PyMOL selector (`{molql: …}` from
   `molql('…')`).
3. **Annotations from a file**: `color_from_uri` / `tooltip_from_uri` with a CIF or JSON table of per-residue values.
   This is how you put your own data (variants, conservation, scores) on a structure without touching the file.
4. **Primitives**: labels, arrows, distances, a box, for the "point at this" part of a figure.
5. **Python or TypeScript**: the same builder exists in Python (`molviewspec`), so you can build a scene in a notebook
   from your own analysis. One slide shows the same scene in both, with a link to the default Colab notebook
   (https://colab.research.google.com/drive/1O2TldXlS01s-YgkD9gy87vWsfCBTYuz9). The talk and the playground use
   TypeScript, because it runs in the browser with nothing to set up, and the editor completes and checks it as you
   type. SeqViewSpec has no Python builder yet; it may get one later.
6. **Portability**: a scene can be saved as `.mvsx` with its data, embedded in a page, or rendered to an image by
   `mvs-render`.

**Example A: p53, from sequence to variant.** Builds on AFDB (Wed), Missense3D (Thu), and the disorder talk after lunch.

- AF-P04637-F1 coloured by pLDDT: a confident DNA-binding domain, a tetramerisation helix, disordered termini.
- 1TSR: the DNA-binding domain on DNA.
- Cancer hotspots as an annotation file (R175, G245, R248, R249, R273, R282): **contact** mutants (R248, R273 touch DNA)
  vs **structural** mutants (R175, G245, R249, R282 hold the fold). Colour and tooltip come from the file, and a MolQL
  selector shows "residues within 4 Å of DNA".
- Try it: change the hotspot list, or the distance to DNA.

## 4. Sequences: Seq\*, SeqViewSpec, SeqQL (6 min)

- **Seq\***: a sequence viewer built for the same descriptions. It handles alignments, tracks, many sequences, and
  linking to 3D.
- **SeqViewSpec**: the sequence counterpart of MolViewSpec, with the same node shape, the same `*_from_uri` annotations,
  and snapshots. It says what to show, not how to draw it.
- **SeqQL**: selections on sequences, in the style of MolQL. Example: `(and 1brs/A (partners 1brs/D :via contacts))`,
  meaning "residues of A that touch D", computed from the structure and shown in the sequence. The `Q` builder writes
  the same thing in code.
- **Live in Prism**: Prism loads both an MVS tree and a SeqViewSpec, so the sequence band and the 3D view show the same
  example. The Seq\* storybook has more (alignments, tracks, streaming) for anyone who asks.
- **Linking**: hover a residue in the sequence and it lights up in 3D, and the reverse. pLDDT, secondary structure,
  SIFTS coverage and PAE come from the structure.
- Example A again: the p53 sequence with domain tracks (TAD, DBD, tetramerisation), pLDDT and hotspots, linked to the AF
  model. SeqQL selects the DNA-contacting residues.
- Try it: write a SeqQL query for the residues of p53 that contact DNA in 1TSR.

## 5. Volumes, with example B: imatinib in ABL (5 min)

Builds on EMDB (Tue) and ChEMBL (Fri morning).

- **The principle of the volume server**: maps are large, and you usually need a box around what you look at. The server
  keeps each map at several resolutions and returns only the region and level of detail you ask for, as BinaryCIF. That
  is why PDBe and EMDB pages show density in seconds. It serves both X-ray (2Fo-Fc, Fo-Fc) and cryo-EM maps.
- In MVS: a `volume` node with isosurface or grid-slice representations. Streaming around a selection is set with the
  `molstar_volume_streaming` custom property.

**Example B: imatinib in ABL kinase, a drug and its evidence.** Data: 1IEP (c-Abl kinase domain + STI-571); 2HYY is an
alternative.

- Imatinib in its pocket: residues within 5 Å, hydrogen bonds, DFG-out conformation.
- 2Fo-Fc density around the ligand from the volume server: is the ligand supported by the data? This ties to validation
  and PDB-REDO (Tue).
- Gatekeeper T315 labelled. T315I is the clinical resistance mutation, and the threonine's hydroxyl forms an H-bond to
  imatinib.
- Try it: change the iso level (σ), or move the box to another residue.

## 6. Stories, MolViewStories, example C (6 min)

- A story is a list of snapshots of one MVS description, each with a short text, played with transitions. It can be
  written by hand or in code.
- **Example C: SARS-CoV-2 spike, a light story.** It is a plain multi-snapshot MVS (3D only; no sequence in the story
  yet):
  1. The cryo-EM map EMD-21375 at low contour, the shape you see first.
  2. The fitted model 6VSB inside it. One receptor-binding domain (RBD) is "up".
  3. Glycans shown: the shield.
  4. The RBD up vs down: why "up" matters.
  5. 6M0J: the RBD bound to ACE2, with interface residues.
- **MolViewStories** (https://molstar.org/mol-view-stories/): the place to build such stories without setting anything
  up. How it works, on one slide with a screenshot of the landing page:
  - A story is a list of scenes. Each scene is a short JavaScript snippet against the MVS builder, plus a camera and a
    text in Markdown.
  - It has a live preview, example stories (the ABL kinase one matches example B), export as a self-contained file or a
    shared link, and "My Stories" for saved work.
  - It is published: Slanináková et al., Protein Science 2026, https://doi.org/10.1002/pro.70540.
- Brief live look (≈1 min): open the ABL Kinase example, edit one scene's code, and watch the preview change.
- Example C is shown as playback, with a link so participants can step through it themselves.

## 7. Your turn: the playground (4 min, then questions)

The playground is guided, for people who do not write code:

- A start page with **one-click examples**: cards for A (p53), B (imatinib) and C (spike), plus the smallest scene. Each
  card opens the snippet already run, with the viewer beside it.
- Each example has 2–3 **suggested edits** of rising difficulty, written next to the code, e.g. "change `1tsr` to
  `2ocj`", "add R213 to the hotspots", "raise the iso level to 2σ". Each comes with a "show me" button that applies it,
  and a "reset" to go back.
- Errors are shown in plain words at the line where they happen, and the last working scene stays on screen.
- For more: links to MolViewStories (to build a story), the Colab notebook (Python), and the MVS docs.
- Wrap-up slide: the links (Mol\*, MolViewSpec docs, Python molviewspec, Colab, MolViewStories, the playground), how to
  cite, how to get in touch.

## Biology checks

Done 2026-10-18; the facts the snippets use are in [examples.md](examples.md).

## The deck as built

`src/slides/` has one function per part (`parts/part0.ts` … `part8.ts`, `parts/python.ts`) and 40 slides in one flat row
(a vertical stack per part would make → skip the rest of a part). Every slide has speaker notes (the S key) and a footer
with its part's tag.

| Part | Slides                                                                                                                                                                                                                                                                                                                                                                        |
| ---- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0    | title, "Using Mol\* to visualise your data" (with Prism's quantum splash) · why visualise (this talk shows, it does not compute) · the plan with the playground QR code                                                                                                                                                                                                       |
| 1    | classic vs Prism (morph) · "What's better in Prism": the live viewer stepped through seven things (tree, selection, selection visuals, volumes, images and animations, Seq\*, command menu)                                                                                                                                                                                   |
| 2    | the map of the talk ("Data, descriptions, viewers") · a description is a tree of steps                                                                                                                                                                                                                                                                                        |
| 3    | opener with the map · `basics-smallest` · `basics-selectors` · how a selection is written (schema, MolQL, PyMOL; the P-loop of 1IEP) · "Example: PyMOL selectors" (`basics-pymol`) · data stays outside the structure · `basics-annotations` · `basics-primitives` · portability · example A · `p53-af-plddt` · numbering · `p53-dna` · `p53-hotspots` · checked, not guessed |
| 4    | opener · SeqViewSpec shape · `p53-sequence` (SeqQL is not shown)                                                                                                                                                                                                                                                                                                              |
| 5    | opener · the volume server's principle · `imatinib-pocket` · `imatinib-density`                                                                                                                                                                                                                                                                                               |
| 6    | opener · MolViewStories · snapshots and transitions · `spike-story` stepped by →                                                                                                                                                                                                                                                                                              |
| 7    | Python or TypeScript + Colab · the playground (QR code, one card per example) · when can I use it (today: MVS, Python, MolViewStories, volume server; beta: Prism and Seq\*, more stable in 1–2 months) · links, citations, thanks                                                                                                                                            |

Choices not in the sections above:

- The map (part 2, `partsMap(current?)`) is one SVG: data, descriptions (written in TypeScript or Python), viewers and
  outputs, three tinted columns of equal cards and one arrow between each two. The openers of parts 3–6 show it with the
  part's cards lit.
- The Prism tour (`tour.ts`, `viewer/tour.ts`) puts the viewer (full UI, 1IEP, its density by volume streaming, the
  animation export as the app has it) in a pose per step, set whole from a clean base through the public API, the scene
  tree's own pick and expand state and the command menu button, so each step leaves the UI as a click would. A reveal
  fragment per item after the first.
- A code slide has a second tab with what the snippet produced (MVSJ, or the SeqViewSpec document) and, when it reads
  `asset('…')`, a Data tab with the file (a table with its residue keys marked). The code column is 40% and its font
  scales with the column; a long line scrolls, it is not wrapped; ⇔ widens the column.
- Principle slides (`principles.ts`; static, one picture or code pair): state not steps (2); one selection in PyMOL,
  VMD, MolScript and the builder, data stays outside, numbering (auth, label, UniProt), checked not guessed (3);
  snapshots and transitions (6).
- The title slide's splash mounts when the slide is current and is disposed when it is left (no frame callback, canvas,
  observer or listener remains), and pauses while the page is hidden.
- Weights: `--slide-weight-heavy` for titles (slides, cards, list items), `--slide-weight-medium` for emphasis and
  labels.
- Reveal's arrows are scaled into the bottom right corner, where every slide's footer leaves room for them. The speaker
  view's frames (`receiver` in the address) get no viewers.
- The playground address in the QR codes is the page's own.
- No assistant in this talk: it was cut (2026-10-18), so no slide, tour step or dependency names it.

To cut for time (30 to 60 seconds each): portability, example A intro, state not steps, checked not guessed, snapshots
and transitions, the selection languages, numbering.
