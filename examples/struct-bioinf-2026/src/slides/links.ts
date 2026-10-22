/**
 * Copyright (c) 2026 mol* contributors, licensed under MIT, See LICENSE file for more info.
 *
 * Developed in collaboration with Anyfold <https://anyfold.ai/>
 *
 * @author David Sehnal <david.sehnal@gmail.com>
 */

import { modeHref } from '../mode.js';

// The addresses the deck names (outline.md §3, §6, §7).

export const Links = {
  molstar: 'https://molstar.org',
  github: 'https://github.com/molstar/molstar',
  viewSpecDocs: 'https://molstar.org/mol-view-spec-docs/',
  pythonPackage: 'https://pypi.org/project/molviewspec/',
  colab: 'https://colab.research.google.com/drive/1O2TldXlS01s-YgkD9gy87vWsfCBTYuz9',
  viewStories: 'https://molstar.org/mol-view-stories/',
  viewStoriesPaper: 'https://doi.org/10.1002/pro.70540',
  molstarPaper: 'https://doi.org/10.1093/nar/gkab314',
  prismPreview: 'https://molstar.org/prism-preview/',
  uiStorybook: 'https://molstar.org/ui-storybook/',
  /** Where this deck and its playground are hosted, and their code. */
  slides: 'https://dsehnal.github.io/slides/struct-bioinf-2026/',
  code: 'https://github.com/dsehnal/struct-bio-2026',
} as const;

/**
 * The playground's public address, for the QR codes and the printed links: always the hosted one, so the audience gets
 * a link that works even when the deck runs from the presenter's laptop. (The "try it" chips stay relative.)
 */
export function playgroundUrl(): string {
  return new URL(modeHref('playground'), Links.slides).href;
}
