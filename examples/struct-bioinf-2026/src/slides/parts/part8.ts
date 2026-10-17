/**
 * Copyright (c) 2026 mol* contributors, licensed under MIT, See LICENSE file for more info.
 *
 * Developed in collaboration with Anyfold <https://anyfold.ai/>
 *
 * @author David Sehnal <david.sehnal@gmail.com>
 */

import { modeHref } from '../../mode.js';
import { escapeHtml, link, notes, slide, stage } from '../html.js';
import { Links, playgroundUrl } from '../links.js';
import { qrSvg } from '../qr.js';

// Part 8, Your turn: the playground (outline.md §8, 3 min, then questions).

const Cards: readonly { id: string; title: string; text: string }[] = [
  { id: 'basics-smallest', title: 'The smallest scene', text: 'Download, parse, draw.' },
  { id: 'p53-af-plddt', title: 'A: p53', text: 'Confidence, DNA, hotspots, sequence.' },
  { id: 'imatinib-pocket', title: 'B: imatinib', text: 'A drug and its evidence.' },
  { id: 'spike-story', title: 'C: the spike', text: 'A light story.' },
];

export function part8(): string {
  const url = playgroundUrl();
  return [
    slide({
      part: 8,
      notes: notes(
        'Your turn. The playground is guided, for people who do not write code. Scan the QR code or open the link in the chat.',
        '- It starts from <strong>one-click examples</strong>: cards for the smallest scene, A (p53), B (imatinib) and C (the spike). Each opens the snippet already run, with the viewer beside it.',
        '- Each example has 2–3 <strong>suggested edits</strong> of rising difficulty, written next to the code, for example "change <code>1tsr</code> to <code>2ocj</code>", "add R213 to the hotspots", "raise the iso level to 2σ". A "show me" button applies the edit, and "reset" goes back.',
        '- Errors are shown in plain words at the line where they happen, and the last working scene stays on screen. You cannot break it.',
        'We now have the questions. Use the playground during them: ask, and I will show it, or try it yourself.',
      ),
      body: `
        <h2>Your turn: the playground</h2>
        <div class="two-col wide-right center">
          <div class="stack">
            <div class="qr-box big">${qrSvg(url, 'QR code of the playground address')}</div>
            <p class="url">${escapeHtml(url)}</p>
          </div>
          <div class="stack">
            <p class="lead">One click opens an example with its viewer, and suggested edits next to the code.</p>
            <div class="cards two">
              ${Cards.map((c) => `<a class="card" href="${modeHref('playground')}&snippet=${encodeURIComponent(c.id)}" target="_blank" rel="noopener"><h3>${escapeHtml(c.title)}</h3><p>${escapeHtml(c.text)}</p></a>`).join('')}
            </div>
          </div>
        </div>`,
    }),

    slide({
      part: 8,
      notes: notes(
        'The links, in one place, and they are in the chat. The Mol* paper is the one to cite for the viewer; MolViewStories has its own citation.',
        'How to get in touch: GitHub issues and discussions for Mol*. Thank you, and over to your questions.',
        'Say thanks to the organisers and to Anyfold, with whom this work is developed.',
      ),
      body: `
        <h2>Links, and thank you</h2>
        ${stage(`<ul class="links">
          <li><span class="what">Mol*</span>${link(Links.molstar)}</li>
          <li><span class="what">MolViewSpec docs</span>${link(Links.viewSpecDocs)}</li>
          <li><span class="what">Python molviewspec</span>${link(Links.pythonPackage)}</li>
          <li><span class="what">Colab notebook</span>${link(Links.colab, 'colab.research.google.com/drive/1O2TldXlS01s-YgkD9gy87vWsfCBTYuz9')}</li>
          <li><span class="what">MolViewStories</span>${link(Links.viewStories)}</li>
          <li><span class="what">The playground</span>${link(url)}</li>
          <li><span class="what">Get in touch</span>${link(Links.github)}</li>
          <li><span class="what">Cite Mol*</span>${link(Links.molstarPaper, 'Sehnal et al., Nucleic Acids Res. 2021, doi:10.1093/nar/gkab314')}</li>
          <li><span class="what">Cite MolViewStories</span>${link(Links.viewStoriesPaper, 'Slanináková et al., Protein Science 2026, doi:10.1002/pro.70540')}</li>
        </ul>
        <p class="big-statement">Your figure is <strong>a description</strong>. Thank you, and questions.</p>`)}`,
    }),
  ].join('');
}
