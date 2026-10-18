/**
 * Copyright (c) 2026 mol* contributors, licensed under MIT, See LICENSE file for more info.
 *
 * Developed in collaboration with Anyfold <https://anyfold.ai/>
 *
 * @author David Sehnal <david.sehnal@gmail.com>
 */

import { modeHref } from '../mode.js';

// What the parts of the deck share: escaping, speaker notes, the slide wrapper and the links.

export const escapeHtml = (text: string) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** The parts of the talk (outline.md), by number. */
export const PartNames = [
  'Opening',
  'The new viewer: Prism',
  "Describe, don't click",
  'MolViewSpec',
  'Sequences',
  'Volumes',
  'Stories',
  'Your turn',
] as const;

/**
 * Speaker notes (`<aside class="notes">`): one string a paragraph, and strings starting with `- ` a bullet list. The text
 * may hold inline HTML (`<code>`); it is not escaped.
 */
export function notes(...lines: string[]): string {
  const out: string[] = [];
  let list: string[] = [];
  const flush = () => {
    if (list.length) out.push(`<ul>${list.map((l) => `<li>${l}</li>`).join('')}</ul>`);
    list = [];
  };
  for (const line of lines) {
    if (line.startsWith('- ')) list.push(line.slice(2));
    else {
      flush();
      out.push(`<p>${line}</p>`);
    }
  }
  flush();
  return `<aside class="notes">${out.join('')}</aside>`;
}

/** The rest of a text slide under its title: it fills the slide and centers its content, so the title stays where it is. */
export function stage(html: string): string {
  return `<div class="stage">${html}</div>`;
}

export interface SlideOptions {
  /** The part of the talk (0–8): its name is the tag in the footer. */
  readonly part: number;
  readonly notes: string;
  /** Classes of the section (`live-slide` for a slide with a `data-live`). */
  readonly className?: string;
  /** `data-*` attributes of the section: a live slide's `live` (the scene) and its parameters. */
  readonly data?: Readonly<Record<string, string>>;
  readonly body: string;
  /** Goes to the left of the footer, after the part tag (the "try it" chip). */
  readonly foot?: string;
}

/** A slide: the body, the footer (the part's tag, then `foot`) and the notes. */
export function slide(o: SlideOptions): string {
  const data = Object.entries(o.data ?? {})
    .map(([k, v]) => ` data-${k}="${escapeHtml(v).replace(/"/g, '&quot;')}"`)
    .join('');
  return `
    <section class="${o.className ?? ''}" data-part="${o.part}"${data}>
      ${o.body}
      <footer class="slide-foot"><span class="part-tag">${PartNames[o.part]}</span>${o.foot ?? ''}</footer>
      ${o.notes}
    </section>`;
}

/** The playground at a snippet (`?mode=playground&snippet=<id>`), a link that opens in a tab of its own. */
export function tryItChip(snippetId: string): string {
  return `<a class="chip try-it" href="${modeHref('playground')}&snippet=${encodeURIComponent(snippetId)}" target="_blank" rel="noopener">Try it in the playground</a>`;
}

export function link(href: string, text = href): string {
  return `<a href="${escapeHtml(href)}" target="_blank" rel="noopener">${escapeHtml(text)}</a>`;
}
