/**
 * Copyright (c) 2026 mol* contributors, licensed under MIT, See LICENSE file for more info.
 *
 * Developed in collaboration with Anyfold <https://anyfold.ai/>
 *
 * @author David Sehnal <david.sehnal@gmail.com>
 */

import { modeHref } from '../mode.js';

// The addresses the deck names (outline.md §3, §6, §8).

export const Links = {
  molstar: 'https://molstar.org',
  github: 'https://github.com/molstar/molstar',
  viewSpecDocs: 'https://molstar.org/mol-view-spec-docs/',
  pythonPackage: 'https://pypi.org/project/molviewspec/',
  colab: 'https://colab.research.google.com/drive/1O2TldXlS01s-YgkD9gy87vWsfCBTYuz9',
  viewStories: 'https://molstar.org/mol-view-stories/',
  viewStoriesPaper: 'https://doi.org/10.1002/pro.70540',
  molstarPaper: 'https://doi.org/10.1093/nar/gkab314',
} as const;

/** The playground's absolute address, from the page's own (the QR code and the short text need one that works anywhere). */
export function playgroundUrl(): string {
  return new URL(modeHref('playground'), location.href.split('#')[0]).href;
}
