# struct-bioinf-2026: the specification

The material for the Mol\* v6 talk at the EMBL-EBI Structural bioinformatics course (23 October 2026). It is one app
with two modes:

- **Slides**: interactive HTML slides for the presenter. Each example slide runs live.
- **Playground**: a code editor (Monaco) beside a viewer, where participants run and edit the same snippets.

| File                       | What it covers                                                              |
| -------------------------- | --------------------------------------------------------------------------- |
| [examples.md](examples.md) | the three examples: entries, chains, residues, checked against PDBe/UniProt |
| [outline.md](outline.md)   | the talk: audience, message, timing, parts, examples                        |

## Decisions

1. **One app, two modes.** A slide's snippet is the playground's starting point ("Open in playground" carries it), so
   the snippets are written once. The mode is a URL parameter, so participants get the playground link and the presenter
   gets the slides.
2. **Snippets are data.** Each example is a file holding a title, a short text, and code in one of three kinds: MVS
   builder code, SVS builder code, or a SeqQL query. Both modes read these files. The slides add text and diagrams
   around them.
3. **The code runner is ported from stories-untold** (`lib/stories/mvs-code`):
   - The snippet runs in a sandboxed iframe (`allow-scripts`, null origin, CSP `default-src 'none'`) with a time limit.
   - It returns an MVS tree as JSON. The page validates the tree and loads it.
   - Monaco gets the builder's types as one generated `.d.ts` (extraLibs).
   - It builds from `@molstar/mvs-builder` (and `/molql`) and its published declarations. The SVS builder
     (`@molstar/seq-core/builder`) is the global `seq`, with its own generated typings (the editor switches typings by
     the snippet's kind); the result is validated with Seq\*'s `validate` (kernel and Mol\* registries). SeqQL's `Q` is
     not in the runner yet.
   - `asset(name)` is a global for the files of `public/data`: the sandbox has no address of its own, so the page passes
     its own and `asset` resolves `data/<name>` against it.
4. **The examples are biological.** There are three, each tied to a session earlier in the week (outline.md): p53 for
   sequence, variants and pLDDT; imatinib/ABL for ligand and density; the spike for cryo-EM and a story.
5. **No assistant.** The talk does not show Prism's assistant, and neither the slides nor the playground load it.
   Nothing needs an account or an install.
6. **One viewer: Prism.** Slides and playground both embed the Prism viewer, which loads MVS and takes SVS for its
   sequence band. Then what participants see in the playground is what was shown in the talk. No example combines MVS
   and SVS in one story yet.
7. **Slides are reveal.js with our own parts.** Reveal does the deck: navigation, fragments, speaker notes, overview.
   Ours are the live parts: a slide that embeds the viewer and runs a snippet, the code/MVSJ side by side, the "try it"
   chip that opens the playground.
8. **Built with Vite** (like `examples/minimal-prism-viewer`), so Monaco's workers load with `?worker`. It is kept out
   of `pnpm build:apps` (`"molstar": {"builder": "vite"}`).
9. **Hosted as a static build on GitHub Pages**, published by hand from `vite build`. No server; all data comes from
   public services (PDBe, AFDB, the PDBe volume server).
10. **Guided playground.** The playground starts from one-click example cards, with suggested edits next to the code
    (outline.md §7). It is a place to try small changes, not an IDE.
11. **Live slides hold one scene, which may hold several viewers.** A scene function gets its slide, mounts what it
    needs and returns one dispose; one live slide at a time keeps the WebGL contexts to that slide's. The
    classic-vs-Prism slide (outline.md §1) stacks the classic `Viewer` (`@molstar/viewer`, loaded lazily with its SCSS)
    under Prism in one box and cross-fades their opacity (a fragment step, a slider). It is the one place the classic
    viewer is used, so its styles are imported next to it and every rule is under `.msp-*`.

## Assets to prepare

- A screenshot of the MolViewStories landing page (https://molstar.org/mol-view-stories/) for outline.md §6.
- A recording of the Prism tour (§1) as the fallback.
- A QR code and a short URL for the playground.
