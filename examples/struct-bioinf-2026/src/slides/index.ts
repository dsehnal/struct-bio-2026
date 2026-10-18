/**
 * Copyright (c) 2026 mol* contributors, licensed under MIT, See LICENSE file for more info.
 *
 * Developed in collaboration with Anyfold <https://anyfold.ai/>
 *
 * @author David Sehnal <david.sehnal@gmail.com>
 */

import Reveal, { type RevealApi } from 'reveal.js';
import RevealNotes from 'reveal.js/plugin/notes';
import 'reveal.js/reveal.css';
import 'reveal.js/theme/white.css';
import './slides.css';
import { deckHtml } from './deck.js';
import { LiveSlides } from './live.js';
import { deckNav } from './nav.js';

// Slides mode (_spec/README.md decision 7): reveal.js does the deck (navigation, fragments, notes, overview), the live
// parts are ours (`live.ts`). Reveal's own layout scaling is off: it scales the deck with a CSS transform, and the
// viewer's canvas needs real pixels for picking, so our CSS sizes the slides to the window instead.

export async function startSlides(root: HTMLElement): Promise<void> {
  root.innerHTML = `<div class="reveal"><div class="slides">${deckHtml()}</div></div>`;
  const deck = new Reveal(root.querySelector<HTMLElement>('.reveal')!, {
    hash: true,
    disableLayout: true,
    // Our own ‹ n / N › (`nav.ts`), with a list of the slides behind the number.
    controls: false,
    progress: true,
    transition: 'fade',
    width: '100%',
    height: '100%',
    margin: 0,
    // Reveal's keys (space, letters, Home/End, …) would also fire while someone works in a viewer or types in it; the
    // deck takes ← and → only (`navigationKeys`).
    keyboard: false,
    // The speaker view: notes, the next slide and a timer (its S key is off with the others; `deck.getPlugin('notes')`).
    plugins: [RevealNotes],
  });
  navigationKeys(deck);
  deckNav(deck, root);
  // The speaker view shows the current and the next slide in frames of the same page (`receiver` in the address): those
  // frames are pictures of the deck, so they get no viewers (the presenter's own window has them).
  const preview = /[?&]receiver\b/.test(location.search);
  if (preview) document.documentElement.classList.add('deck-preview');
  const live = new LiveSlides(deck);
  const sync = () => live.show(preview ? undefined : (deck.getCurrentSlide() ?? undefined));
  deck.on('ready', sync);
  deck.on('slidechanged', sync);
  await deck.initialize();
}

/** ← and → step the deck (fragments included), unless the key goes to a text field, also inside a viewer's shadow root. */
function navigationKeys(deck: RevealApi) {
  window.addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
    if (isEditable(e.composedPath()[0])) return;
    e.preventDefault();
    if (e.key === 'ArrowLeft') deck.prev();
    else deck.next();
  });
}

function isEditable(target: EventTarget | undefined) {
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || target.matches('input, textarea, select');
}
