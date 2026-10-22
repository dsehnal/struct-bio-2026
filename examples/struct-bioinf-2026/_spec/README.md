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
   - `tmAlign({ reference, mobile })` superposes a chain of one structure file on a chain of another (Mol\*'s TM-align)
     and gives the matrix for a `transform` node, so a snippet needs no precomputed numbers. It runs in the page, not
     the sandbox, which has no network and no Mol\*: the call goes out by postMessage, the page downloads and aligns
     (cached by parameters, `runner/tm-align.ts`) and replies. The snippet's 5 s budget stops while the page works; the
     call has its own limit of 60 s and fails as an error at its line.
4. **The examples are biological.** There are three, each tied to a session earlier in the week (outline.md): p53 for
   sequence, variants and pLDDT; imatinib/ABL for ligand and density; the spike for cryo-EM and a story.
5. **No assistant.** The talk does not show Prism's assistant, and neither the slides nor the playground load it.
   Nothing needs an account or an install.
6. **One viewer: Prism.** Slides and playground both embed the Prism viewer, which loads MVS and takes SVS for its
   sequence band. Then what participants see in the playground is what was shown in the talk. No example combines MVS
   and SVS in one story yet. It renders with WebGL (2, with a WebGL 1 fallback), never WebGPU
   (`renderer.graphicsBackend: 'webgl'`, the classic viewer too): Prism's `auto` would pick WebGPU where it can, and
   that is not ready for a live talk.
7. **Slides are reveal.js with our own parts.** Reveal does the deck: navigation, fragments, speaker notes, overview.
   Ours are the live parts: a slide that embeds the viewer and runs a snippet, the code/MVSJ side by side, the "try it"
   chip that opens the playground.
8. **Built with Vite** (like `examples/minimal-prism-viewer`), so Monaco's workers load with `?worker`. It is kept out
   of `pnpm build:apps` (`"molstar": {"builder": "vite"}`).
9. **Hosted as a static build on GitHub Pages** at `dsehnal.github.io/slides/struct-bioinf-2026`, the code at
   `github.com/dsehnal/struct-bio-2026`, published by hand from `vite build`. No server; all data comes from public
   services (PDBe, AFDB, the PDBe volume server). The QR codes and printed playground links always name the hosted
   address (`links.ts`), so they work when the deck runs locally; the "try it" chips stay relative.
10. **Guided playground.** The playground starts from one-click example cards, with suggested edits next to the code
    (outline.md §7). It is a place to try small changes, not an IDE.
11. **Live slides hold one scene, which may hold several viewers.** A scene function gets its slide, mounts what it
    needs and returns one dispose; one live slide at a time keeps the WebGL contexts to that slide's. The
    classic-vs-Prism slide (outline.md §1) stacks the classic `Viewer` (`@molstar/viewer`, loaded lazily with its SCSS)
    under Prism in one box and cross-fades their opacity (a fragment step, a slider). It is the one place the classic
    viewer is used, so its styles are imported next to it and every rule is under `.msp-*`.

12. **Visual style: Prism's, from one place.** The slides, the playground and the viewer's box look like Mol*/Prism, not
    a stock template. `src/fonts.css` is the only place the palette lives, copied from prism-ui's light theme
    (`styles/theme.css`): the canvas `#fcfbf9` is the page, the panel `#eeece7` what holds things, the ink `#332b1f`, a
    warm muted brown-grey, hairlines of the ink at 13%, code on warm paper, Prism's small radii. The only accents are
    the wordmark's four colors (brown, gold, sage, steel; a darker shade of each where it is text, 4.5:1 or more) and
    their spectrum, the wordmark's own gradient: a rule under every slide title and reveal's progress bar. One color a
    part (0–1 brown, 2–3 gold, 4–5 sage, 6–7 steel) lights the parts map and ticks the cards and stars of its slides.
    Cards are columns divided by hairlines with a short tick, not boxes; only real panels (code, viewers, the
    playground's panes) have the glass edge (a hairline, no shadow); the ✳ of the Mol\* star is the bullet and the mark
    of a pull quote. Code colors are the same in the slides' highlighter, their Data tabs and Monaco's theme
    (`runner/editor.ts`). Red and teal stay for the biology (the hotspots are data). Fonts are Prism's stack. Titles are
    weight 600 and tight, with no kicker above them. Type is one scale of roles (`--fs-display`, `-title`, `-lead`,
    `-body`, `-small`, `-label`, `-code`, `-code-dense` in `slides.css` `:root`): a text takes its size from its role,
    never a size of its own, and code inside a text is 0.92 of the text.

## Assets to prepare

- A screenshot of the MolViewStories landing page (https://molstar.org/mol-view-stories/) for outline.md §6.
- A recording of the Prism tour (§1) as the fallback.
- A QR code and a short URL for the playground.
