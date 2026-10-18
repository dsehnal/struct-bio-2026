/**
 * Copyright (c) 2026 mol* contributors, licensed under MIT, See LICENSE file for more info.
 *
 * Developed in collaboration with Anyfold <https://anyfold.ai/>
 *
 * @author David Sehnal <david.sehnal@gmail.com>
 */

import { notes, slide } from '../html.js';
import { Links } from '../links.js';
import { snapshotsSlide } from '../principles.js';
import { storySlide } from '../story.js';
import { opener } from './opener.js';

// Part 6, Stories, MolViewStories, example C (outline.md §6, 6 min).

export function part6(): string {
  return [
    opener({
      part: 6,
      title: 'Stories',
      time: '30–36 min, with example C: the spike',
      points: [
        '<strong>A story</strong>: a list of snapshots of one description, each with a short text',
        '<strong>MolViewStories</strong>: build one with nothing to install',
        '<strong>Example C</strong>: the SARS-CoV-2 spike, played back',
      ],
      notes: notes(
        'Stories. A story is a list of snapshots of one MolViewSpec description, each with a short text, played with transitions. It can be written by hand or in code.',
        'On the map: a story is a MolViewSpec description with several snapshots, and what you publish is a file or a link: the right-hand column.',
        'First the tool that makes them without setting anything up, then a story to play: the spike.',
      ),
    }),

    slide({
      part: 6,
      notes: notes(
        'MolViewStories is the place to build such stories without setting anything up. How it works, on one slide.',
        '- A story is a list of <strong>scenes</strong>. Each scene is a short JavaScript snippet against the MVS builder, plus a camera and a text in Markdown. It is the same builder as in part 3.',
        '- It has a <strong>live preview</strong>, example stories (the ABL kinase one matches example B), export as a self-contained file or a shared link, and "My Stories" for saved work.',
        'It is published: Slanináková et al., Protein Science 2026.',
        "Brief live look, about a minute: open the ABL Kinase example, edit one scene's code, and watch the preview change. If the network is slow, stay on this slide.",
      ),
      foot: `<a class="chip" href="${Links.viewStories}" target="_blank" rel="noopener">Open MolViewStories</a>`,
      body: `
        <h2>MolViewStories</h2>
        <div class="two-col wide-right">
          <div class="stack">
            <ul class="points small">
              <li>A story is a list of <strong>scenes</strong>: a short snippet against the MVS builder, a camera, and a text in Markdown.</li>
              <li>A <strong>live preview</strong> as you edit.</li>
              <li><strong>Examples</strong>: the ABL kinase one matches example B.</li>
              <li>Export a <strong>self-contained file</strong> or a <strong>shared link</strong>; <strong>My Stories</strong> keeps your work.</li>
            </ul>
            <p class="cite">Slanináková et al., <em>Protein Science</em> 2026, <a href="${Links.viewStoriesPaper}" target="_blank" rel="noopener">doi:10.1002/pro.70540</a></p>
          </div>
          <div class="shot">
            <img src="img/mol-view-stories.png" alt="The MolViewStories landing page" onerror="this.hidden=true;this.nextElementSibling.hidden=false" />
            <div class="shot-placeholder" hidden>Screenshot of the MolViewStories landing page<br />molstar.org/mol-view-stories<br />(public/img/mol-view-stories.png)</div>
          </div>
        </div>`,
    }),

    snapshotsSlide(6),

    storySlide({
      part: 6,
      snippetId: 'spike-story',
      title: 'Example C: the SARS-CoV-2 spike, a story',
      lead: 'Press → to step through the snapshots.',
      notes: notes(
        'Example C, a light story: the SARS-CoV-2 spike. It is a plain multi-snapshot MolViewSpec, 3D only. Press the right arrow to step; the list on the right shows where we are.',
        '- 1. The cryo-EM map EMD-21375 at low contour: the shape you see first.',
        '- 2. The fitted model 6VSB inside it. One receptor-binding domain (RBD) is "up".',
        '- 3. Glycans shown: the shield.',
        '- 4. The RBD up vs down: why "up" matters.',
        '- 5. 6M0J: the RBD bound to ACE2, with the interface residues.',
        'Optionally: N501, K417 and Q493 are positions changed in variants of concern (N501Y, K417N and Q493R in Omicron).',
        'The "Try it" chip opens the same story in the playground, so participants can step through it themselves.',
      ),
    }),
  ].join('');
}
