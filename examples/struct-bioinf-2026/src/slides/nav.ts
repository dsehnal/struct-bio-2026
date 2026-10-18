/**
 * Copyright (c) 2026 mol* contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author David Sehnal <david.sehnal@gmail.com>
 */

import type { RevealApi } from 'reveal.js';
import { escapeHtml, PartNames } from './html.js';

// The deck's own navigation, in place of reveal's arrows: ‹, the slide's number, ›. The number opens a list of every
// slide by part, to jump to one (a question about slide 20 during the questions). ← and → stay with `navigationKeys`.

export function deckNav(deck: RevealApi, host: HTMLElement): void {
  const nav = document.createElement('nav');
  nav.className = 'deck-nav';
  nav.setAttribute('aria-label', 'Slides');
  nav.innerHTML = `
    <button type="button" class="prev" aria-label="Previous"><svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
    <button type="button" class="count" aria-haspopup="true" aria-expanded="false" title="Go to a slide"></button>
    <button type="button" class="next" aria-label="Next"><svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
    <div class="deck-menu" role="menu" hidden></div>`;
  host.appendChild(nav);

  const count = nav.querySelector<HTMLButtonElement>('.count')!;
  const menu = nav.querySelector<HTMLElement>('.deck-menu')!;
  nav.querySelector<HTMLButtonElement>('.prev')!.onclick = () => deck.prev();
  nav.querySelector<HTMLButtonElement>('.next')!.onclick = () => deck.next();

  const slides = () => deck.getSlides() as HTMLElement[];
  const current = () => deck.getIndices().h;
  const update = () => {
    count.textContent = `${current() + 1} / ${slides().length}`;
  };

  // A title's line breaks are spaces here ("Molecular visualisation<br />for structural biology").
  const title = (s: HTMLElement) => {
    const h = s.querySelector('h1, h2');
    if (!h) return 'Untitled';
    const c = h.cloneNode(true) as HTMLElement;
    for (const br of c.querySelectorAll('br')) br.replaceWith(' ');
    return c.textContent?.replace(/\s+/g, ' ').trim() || 'Untitled';
  };
  const render = () => {
    const now = current();
    let lastPart = -1;
    const rows: string[] = [];
    slides().forEach((s, i) => {
      const part = Number(s.dataset.part ?? -1);
      if (part !== lastPart && part >= 0) {
        rows.push(`<div class="deck-menu-part" data-part="${part}">${escapeHtml(PartNames[part] ?? '')}</div>`);
        lastPart = part;
      }
      rows.push(
        `<button type="button" role="menuitem" data-index="${i}" class="${i === now ? 'current' : ''}"><span class="n">${i + 1}</span>${escapeHtml(title(s))}</button>`,
      );
    });
    menu.innerHTML = rows.join('');
  };

  const open = () => {
    render();
    menu.hidden = false;
    count.setAttribute('aria-expanded', 'true');
    menu.querySelector<HTMLElement>('.current')?.scrollIntoView({ block: 'center' });
  };
  const close = () => {
    menu.hidden = true;
    count.setAttribute('aria-expanded', 'false');
  };

  count.onclick = () => (menu.hidden ? open() : close());
  menu.onclick = (e) => {
    const item = (e.target as HTMLElement).closest<HTMLElement>('[data-index]');
    if (!item) return;
    close();
    deck.slide(Number(item.dataset.index));
  };
  // Closed by Escape, a click elsewhere, or a change of slide.
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !menu.hidden) close();
  });
  document.addEventListener('pointerdown', (e) => {
    if (!menu.hidden && !nav.contains(e.target as Node)) close();
  });
  deck.on('slidechanged', () => {
    update();
    close();
  });
  deck.on('ready', update);
}
