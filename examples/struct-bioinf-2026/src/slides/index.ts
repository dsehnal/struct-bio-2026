/**
 * Copyright (c) 2026 mol* contributors, licensed under MIT, See LICENSE file for more info.
 *
 * Developed in collaboration with Anyfold <https://anyfold.ai/>
 *
 * @author David Sehnal <david.sehnal@gmail.com>
 */

import Reveal from 'reveal.js';
import 'reveal.js/reveal.css';
import 'reveal.js/theme/white.css';
import './slides.css';
import { deckHtml } from './deck.js';
import { LiveSlides } from './live.js';

// Slides mode (_spec/README.md decision 7): reveal.js does the deck (navigation, fragments, notes, overview), the live
// parts are ours (`live.ts`). Reveal's own layout scaling is off: it scales the deck with a CSS transform, and the
// viewer's canvas needs real pixels for picking, so our CSS sizes the slides to the window instead.

export async function startSlides(root: HTMLElement): Promise<void> {
  root.innerHTML = `<div class="reveal"><div class="slides">${deckHtml()}</div></div>`;
  const deck = new Reveal(root.querySelector<HTMLElement>('.reveal')!, {
    hash: true,
    disableLayout: true,
    controls: true,
    progress: true,
    transition: 'fade',
    width: '100%',
    height: '100%',
    margin: 0,
  });
  const live = new LiveSlides();
  const sync = () => live.show(deck.getCurrentSlide() ?? undefined);
  deck.on('ready', sync);
  deck.on('slidechanged', sync);
  await deck.initialize();
}
