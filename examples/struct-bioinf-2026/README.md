# struct-bioinf-2026

The material for the Mol\* v6 talk at the EMBL-EBI Structural bioinformatics course (23 October 2026): interactive
slides and a guided playground, one Vite app with two modes, both embedding the [Prism](../../packages/prism/AGENTS.md)
viewer. The talk and the decisions are in [`_spec/`](_spec/README.md) ([outline](_spec/outline.md)).

```sh
pnpm -C examples/struct-bioinf-2026 dev        # http://localhost:5173, from the workspace sources
pnpm -C examples/struct-bioinf-2026 build      # vite build → build/ (static, relative paths)
pnpm -C examples/struct-bioinf-2026 preview    # serves build/
pnpm -C examples/struct-bioinf-2026 typecheck
```

| URL                   | Mode                                                                                  |
| --------------------- | ------------------------------------------------------------------------------------- |
| `/` or `?mode=slides` | the slides (reveal.js; a live slide makes a viewer when shown, disposes it when left) |
| `?mode=playground`    | the playground (`&snippet=<id>` opens a snippet: the slides' "try it" links)          |

`build/` can be served from any sub-path (`base: './'` in `vite.config.ts`), e.g. GitHub Pages. It is a Vite app
(`"molstar": { "builder": "vite" }` keeps it out of `pnpm build:apps`); workspace packages resolve to their sources
through the `molstar-src` export condition, so nothing needs building first.

## Layout

| Path              | What                                                                                                                              |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `src/main.ts`     | reads `?mode=` (`src/mode.ts`) and loads the mode's chunk                                                                         |
| `src/viewer/`     | the shared embedded Prism viewer: `createEmbeddedViewer(el)` with `loadMvs` and `loadSvs`; `classic.ts`: the classic Mol* viewer  |
| `src/slides/`     | the reveal.js deck (`deck.ts`), the live-slide lifecycle (`live.ts`), the classic-to-Prism morph (`morph.ts`), our CSS            |
| `src/playground/` | the guided playground: example cards, snippet list, suggested edits, the editor, plain-word errors, deep links                    |
| `src/examples/`   | the snippets both modes read (`basics`, `p53`, `imatinib`, `spike`): code, summary, suggested edits; facts in `_spec/examples.md` |
| `src/runner/`     | the code runner: Monaco with generated typings, the sandboxed iframe, validation of the MVS or SeqViewSpec a snippet builds       |
| `public/data/`    | the annotation files snippets read through `asset('<name>')`                                                                      |
| `scripts/`        | `generate-runner.mjs` (`pnpm generate:runner`): the typings and the iframe runtime in `src/runner/generated/`                     |

## The viewer

`src/viewer/index.ts` composes `DefaultPrismViewerSpec()` (the built-in features: the `loaders` feature with `load.mvs`
and `load.svs`, the sequence band) with `ui.layout.compactRail`, and creates it with `createPrismViewer`. `loadMvs` runs
`load.mvs` (MVSJ of an `MVSData` from `@molstar/mvs-builder`), `loadSvs` runs `load.svs`. The spec has no `persist`, so
there is no key to clash: several viewers may live on a page, and a live slide's viewer is disposed when the slide is
left.
