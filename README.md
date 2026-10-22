# Molecular visualisation for structural biology: slides and playground

This branch holds the talk **"Molecular visualisation for structural biology"** (David Sehnal) at the EMBL-EBI
[Structural bioinformatics](https://www.ebi.ac.uk/training/events/structural-bioinformatics-2026/) course, 23 October
2026, and the Mol\* code it runs on. It is a fork of [molstar/molstar](https://github.com/molstar/molstar) at its v6
development line; everything below the line is Mol\*'s own readme.

- **Slides**: https://dsehnal.github.io/slides/struct-bio-2026/ (interactive: the molecules on the slides are live Mol\*
  viewers)
- **Playground**: https://dsehnal.github.io/slides/struct-bio-2026/?mode=playground (edit and run the examples in the
  browser; nothing to install)
- **Source**: [`examples/struct-bioinf-2026`](examples/struct-bioinf-2026), with the talk's outline and the checked
  facts behind each example in its [`_spec/`](examples/struct-bioinf-2026/_spec/README.md)

The talk shows the new Mol\* viewer (Prism), MolViewSpec descriptions of 3D scenes, sequences (Seq\* and SeqViewSpec),
volumes from the PDBe volume server, superposition and stories, on three biological examples: p53 and its cancer
hotspots, imatinib in the ABL kinase, and the SARS-CoV-2 spike.

## Run the slides locally

You need [Node.js](https://nodejs.org) 22.13 or later and [pnpm](https://pnpm.io) (the version in `package.json`;
`mise install` sets up both). The data comes from public services (PDBe, AlphaFold DB, the PDBe volume server), so you
also need a network connection.

```sh
git clone -b ebi-struct-workshop-26 https://github.com/dsehnal/struct-bio-2026.git
cd struct-bio-2026
pnpm install
pnpm -C examples/struct-bioinf-2026 dev
```

Then open the address it prints (http://localhost:5173 by default): the slides are at `/`, the playground at
`/?mode=playground`. In the slides, use ← and →, or the slide number in the bottom right corner to jump to a slide.

To build a static copy instead:

```sh
pnpm -C examples/struct-bioinf-2026 build        # build/, with relative paths: serve it from any folder
pnpm -C examples/struct-bioinf-2026 build:pages  # build/, for https://dsehnal.github.io/slides/struct-bio-2026/
pnpm -C examples/struct-bioinf-2026 preview      # serve build/ locally
```

---

[![License](http://img.shields.io/badge/license-MIT-blue.svg?style=flat)](./LICENSE)
[![npm version](https://badge.fury.io/js/molstar.svg)](https://www.npmjs.com/package/molstar)
[![Build](https://github.com/molstar/molstar/actions/workflows/node.yml/badge.svg)](https://github.com/molstar/molstar/actions/workflows/node.yml)
[![Gitter](https://badges.gitter.im/molstar/Lobby.svg)](https://gitter.im/molstar/Lobby)

# Mol*

The goal of **Mol\*** (_/'mol-star/_) is to provide a technology stack that serves as a basis for the next-generation
data delivery and analysis tools for (not only) macromolecular structure data. Mol* development was jointly initiated by
PDBe and RCSB PDB to combine and build on the strengths of [LiteMol](https://litemol.org) (developed by PDBe) and
[NGL](https://nglviewer.org) (developed by RCSB PDB) viewers.

When using Mol*, please cite:

David Sehnal, Sebastian Bittrich, Mandar Deshpande, Radka Svobodová, Karel Berka, Václav Bazgier, Sameer Velankar,
Stephen K Burley, Jaroslav Koča, Alexander S Rose:
[Mol* Viewer: modern web app for 3D visualization and analysis of large biomolecular structures](https://doi.org/10.1093/nar/gkab314),
_Nucleic Acids Research_, 2021; https://doi.org/10.1093/nar/gkab314.

### Protein Data Bank Integrations

- The [pdbe-molstar](https://github.com/molstar/pdbe-molstar) library is the Mol* implementation used by EMBL-EBI data
  resources such as [PDBe](https://pdbe.org/), [PDBe-KB](https://pdbe-kb.org/) and
  [AlphaFold DB](https://alphafold.ebi.ac.uk/). This implementation can be used as a JS plugin and a Web component and
  supports property/attribute-based easy customisation. It provides helper methods to facilitate programmatic
  interactions between the web application and the 3D viewer. It also provides a superposition view for overlaying all
  the observed ligand molecules on representative protein conformations.

- [rcsb-molstar](https://github.com/molstar/rcsb-molstar) is the Mol* plugin used by [RCSB PDB](https://www.rcsb.org).
  The project provides additional presets for the visualization of structure alignments and structure motifs such as
  ligand binding sites. Furthermore, [rcsb-molstar](https://github.com/molstar/rcsb-molstar) allows to interactively add
  or hide of (parts of) chains, as seen in the [3D Protein Feature View](https://www.rcsb.org/3d-sequence/4hhb).

## Project Structure Overview

The v6 prototype separates code into pnpm workspace packages:

- `packages/{core,io,model,graphics}` own the shared library layers.
- `packages/plugin/{core,ui,headless}` own plugin runtime, React UI and Node capture.
- `packages/mvs/{builder,runtime}` separate standalone MVS construction from plugin loading.
- `extensions/`, `apps/`, `examples/`, `servers/` and `cli/` own their dependencies and builds.
- `distributions/molstar/` assembles the classic and browser ESM distribution.
- `smoke/` checks isolated package consumers and browser rendering.

See the [workspace guide](.v6/plans/workspace-usage.md) for package APIs, ESM consumption, versioning, commands and the
[implementation plan](.v6/plans/workspace-prototype.md).

## Previous Work

This project builds on experience from previous solutions:

- [LiteMol Suite](https://www.litemol.org)
- [WebChemistry](https://webchem.ncbr.muni.cz)
- [NGL Viewer](http://nglviewer.org)
- [MMTF](http://mmtf.rcsb.org)
- [MolQL](http://molql.org)
- [PDB Component Library](https://www.ebi.ac.uk/pdbe/pdb-component-library/)
- And many others (list will be continuously expanded).

## Building & Running

Use Node 22.13+ and the pnpm version specified in `package.json`.

```sh
pnpm install
pnpm build
pnpm dev                            # all apps and browser examples
pnpm dev:apps                       # all apps
pnpm dev:apps -- viewer             # selected app
pnpm dev:examples                  # all browser examples
pnpm dev:examples -- basic-wrapper  # selected example
```

Run `pnpm check:workspace`, `pnpm test` and `pnpm --dir smoke smoke` to check package boundaries, existing behavior and
packed ESM consumers. The smoke browser requires Chromium. Native GL is opt-in: `pnpm native:install` installs it
separately, and `pnpm test:native` runs the PR's test lanes with it (`-- medium` for the GL suite alone). For capture,
use `pnpm native:run -- pnpm --dir smoke smoke:headless`.

Serve `distributions/molstar/` to access `build/viewer/` and `build/mvs-stories/`. Browser ESM entry points are under
`build/esm/`. Use `node scripts/clean.js --all` for a clean rebuild. Detailed commands and code ownership are in the
[workspace guide](.v6/plans/workspace-usage.md).

Code generators are compiled under their owning `cli/<name>/lib/` directories. For example:

```sh
node cli/cifschema/lib/index.js -mip @molstar/core/data -o packages/io/src/reader/cif/schema/mmcif.ts -p mmCIF
node cli/lipid-params/lib/index.js -o packages/model/src/model/structure/model/types/lipids.ts
node cli/syminfo/lib/index.js
node cli/cif2bcif/lib/index.js input.cif output.bcif
```

## Development

### Editor

To get syntax highlighting for shader files add the following to Visual Code's settings files and make sure relevant
extensions are installed in the editor.

    "files.associations": {
        "*.glsl.ts": "glsl",
        "*.frag.ts": "glsl",
        "*.vert.ts": "glsl"
    },

## Publish

### Prerelease

    npm version prerelease # assumes the current version ends with '-dev.X'
    npm publish --tag next

### Release

    npm version 0.X.0 # provide valid semver string
    npm publish

## Deploy

To prepare apps and demos for https://molstar.org deploy, run:

    npm run test
    npm run deploy:local

To commit these changes remotely to the `molstar/molstar.github.io` repo:

    npm run deploy:remote

## Contributing

Just open an issue or make a pull request. All contributions are welcome.

## Funding

Funding sources include but are not limited to:

- [RCSB PDB](https://www.rcsb.org) funding by a grant [DBI-1338415; PI: SK Burley] from the NSF, the NIH, and the US DoE
- [PDBe, EMBL-EBI](https://pdbe.org)
- [CEITEC](https://www.ceitec.eu/)
- [EntosAI](https://www.entos.ai)
