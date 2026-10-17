/**
 * Copyright (c) 2026 mol* contributors, licensed under MIT, See LICENSE file for more info.
 *
 * Developed in collaboration with Anyfold <https://anyfold.ai/>
 *
 * @author David Sehnal <david.sehnal@gmail.com>
 */

import Reveal from 'reveal.js';
import RevealNotes from 'reveal.js/plugin/notes';
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
    // The speaker view (S): notes, the next slide and a timer.
    plugins: [RevealNotes],
  });
  // The speaker view shows the current and the next slide in frames of the same page (`receiver` in the address): those
  // frames are pictures of the deck, so they get no viewers (the presenter's own window has them).
  const preview = /[?&]receiver\b/.test(location.search);
  const live = new LiveSlides(deck);
  const sync = () => live.show(preview ? undefined : (deck.getCurrentSlide() ?? undefined));
  deck.on('ready', sync);
  deck.on('slidechanged', sync);
  await deck.initialize();
}
