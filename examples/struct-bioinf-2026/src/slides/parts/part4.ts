/**
 * Copyright (c) 2026 mol* contributors, licensed under MIT, See LICENSE file for more info.
 *
 * Developed in collaboration with Anyfold <https://anyfold.ai/>
 *
 * @author David Sehnal <david.sehnal@gmail.com>
 */

import { highlight } from '../highlight.js';
import { notes, slide } from '../html.js';
import { snippetSlide } from '../snippet.js';
import { opener } from './opener.js';

// Part 4, Sequences: Seq*, SeqViewSpec (outline.md §4).

/** The shape of a SeqViewSpec document (seqspec format.md), shortened: data defined once, views of it. */
const SvsShape = `{
  "format": "seq_view_spec",
  "version": "1.0.0",
  "root": {
    "kind": "root",
    "children": [
      { "kind": "data", "children": [
        { "kind": "sequence", "ref": "p53",
          "params": { "value": "MEEPQSDPSV…" } },
        { "kind": "annotation", "ref": "hotspots",
          "params": { "target": "p53",
                      "uri": "…/p53-hotspots.json",
                      "format": "json" } }
      ]},
      { "kind": "view", "ref": "overview",
        "params": { "label": "p53" },
        "children": [
        { "kind": "section", "ref": "main",
          "children": [
          { "kind": "track", "ref": "t1",
            "children": [
            { "kind": "layer", "ref": "l1",
              "params": { "type": "ranges",
                          "data": "hotspots" } }
          ]}
        ]}
      ]}
    ]
  },
  "snapshots": [ … ]
}`;

export function part4(): string {
  return [
    opener({
      part: 4,
      title: 'Sequences',
      time: '19–25 min',
      points: [
        '<strong>Seq*</strong>: a sequence viewer built for the same descriptions: alignments, tracks, many sequences, linked to 3D',
        '<strong>SeqViewSpec</strong>: what to show on a sequence',
      ],
      notes: notes(
        'Sequences. Two names, one map.',
        '- <strong>Seq*</strong> is a sequence viewer built for the same descriptions. It handles alignments, tracks, many sequences, and linking to 3D.',
        '- <strong>SeqViewSpec</strong> is the sequence counterpart of MolViewSpec: the same node shape, the same <code>*_from_uri</code> annotations, and snapshots. It says what to show, not how to draw it.',
        'On the map: they are the middle and right columns for sequences. The Seq* storybook has more (alignments, tracks, streaming) for anyone who asks.',
      ),
    }),

    slide({
      part: 4,
      notes: notes(
        'SeqViewSpec is a JSON document, like MolViewSpec: every node is <code>kind</code>, <code>ref</code>, <code>params</code> and <code>children</code>. The slide shows the shape, shortened.',
        'Data is defined once, under <code>data</code>: sequences, alignments, annotation tables, which may come from a file with <code>uri</code> exactly as in MolViewSpec. Then <strong>views</strong> of that data: a view has sections, a section has tracks, a track has layers, and a layer says what to show: letters, ranges, points, values.',
        'A document says <strong>what</strong> to show, never <strong>how</strong> to draw it. Snapshots are patches over the one tree, so a story of sequence views is cheap.',
        'On the next slides the document is produced by builder code, just like the MolViewSpec one. In the playground you will see this JSON in the second tab.',
      ),
      body: `
        <h2>SeqViewSpec: the same idea for sequences</h2>
        <div class="two-col">
          <pre class="code nowrap"><code>${highlight(SvsShape, 'json')}</code></pre>
          <ul class="points small">
            <li>The <strong>same node shape</strong> as MolViewSpec: <code>kind</code>, <code>ref</code>, <code>params</code>, <code>children</code>.</li>
            <li><strong>Data once</strong> (sequences, alignments, tables), then <strong>views</strong> of it.</li>
            <li>The same <code>*_from_uri</code> annotations: your own table on a sequence.</li>
            <li>It says <strong>what</strong> to show, not how to draw it.</li>
            <li><strong>Snapshots</strong> as patches over the tree.</li>
          </ul>
        </div>`,
    }),

    snippetSlide({
      part: 4,
      snippetId: 'p53-sequence',
      sceneId: 'p53-af-plddt',
      title: 'Example A again: the p53 sequence, linked to the model',
      lead: 'Hover a residue in the sequence and it lights up in 3D, and the reverse. Tracks: regions, hotspots, pLDDT.',
      notes: notes(
        'Prism loads both a MolViewSpec tree and a SeqViewSpec document, so the sequence band and the 3D view show the same example. The 3D scene on the right is the AlphaFold model from part 3; the band under it is this SeqViewSpec.',
        'The tracks are tables of ranges: the domains from UniProt (transactivation, DNA-binding, oligomerisation), the disordered regions, the six hotspots (contact vs structural, same colours as before), and the pLDDT read from the model.',
        '<strong>Linking</strong>: hover a residue in the sequence and it lights up in 3D, and the reverse. Do it on R248 and R273.',
        'Second tab: the SeqViewSpec document the builder produced.',
      ),
    }),
  ].join('');
}
