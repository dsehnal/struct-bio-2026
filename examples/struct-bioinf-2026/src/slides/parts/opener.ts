/**
 * Copyright (c) 2026 mol* contributors, licensed under MIT, See LICENSE file for more info.
 *
 * Developed in collaboration with Anyfold <https://anyfold.ai/>
 *
 * @author David Sehnal <david.sehnal@gmail.com>
 */

import { partsMap } from '../diagrams.js';
import { escapeHtml, slide } from '../html.js';

/** The first slide of parts 3–6: the part's words beside the map of the talk with the part lit. */
export function opener(o: {
  readonly part: number;
  readonly title: string;
  readonly time: string;
  readonly points: readonly string[];
  readonly notes: string;
}): string {
  return slide({
    part: o.part,
    className: 'opener',
    notes: o.notes,
    body: `
      <div class="two-col wide-right">
        <div class="stack">
          <p class="time">Part ${o.part} · ${escapeHtml(o.time)}</p>
          <h2>${escapeHtml(o.title)}</h2>
          <ul class="points small">${o.points.map((p) => `<li>${p}</li>`).join('')}</ul>
        </div>
        ${partsMap(o.part)}
      </div>`,
  });
}
