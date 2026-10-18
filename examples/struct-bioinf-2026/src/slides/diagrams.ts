/**
 * Copyright (c) 2026 mol* contributors, licensed under MIT, See LICENSE file for more info.
 *
 * Developed in collaboration with Anyfold <https://anyfold.ai/>
 *
 * @author David Sehnal <david.sehnal@gmail.com>
 */

import { escapeHtml } from './html.js';

// The deck's inline SVG diagrams. Colors, strokes and text sizes are CSS (slides.css, `.dg-*`), so a diagram follows the
// deck's style; each SVG makes its own arrowhead (a marker in a hidden slide's `display: none` SVG is not drawn).

let arrowCount = 0;
const arrowDefs = (id: string) =>
  `<defs><marker id="${id}" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path class="dg-arrow" d="M0 0 L10 5 L0 10 z"/></marker></defs>`;

interface MapNode {
  readonly title: string;
  readonly sub: string;
  /** The parts of the talk that deal with it (the map's highlight). */
  readonly parts: string;
}

interface MapColumn {
  readonly head: string;
  /** A line under the head. */
  readonly note?: string;
  readonly nodes: readonly MapNode[];
}

const Columns: readonly MapColumn[] = [
  {
    head: 'DATA',
    note: 'what is shown',
    nodes: [
      { title: 'PDBe · AFDB · EMDB', sub: 'structures, models, maps', parts: '3' },
      { title: 'Volume server', sub: 'density by region and detail', parts: '5' },
      { title: 'Annotations', sub: 'CIF, JSON, UniProt tables', parts: '3 4' },
    ],
  },
  {
    head: 'DESCRIPTIONS',
    note: 'written in TypeScript or Python',
    nodes: [
      { title: 'MolViewSpec', sub: '3D scenes and stories', parts: '3 5 6' },
      { title: 'SeqViewSpec', sub: 'sequence views', parts: '4' },
      { title: 'MolQL', sub: 'what to select', parts: '3' },
    ],
  },
  {
    head: 'VIEWERS AND OUTPUTS',
    note: 'where it is drawn or kept',
    nodes: [
      { title: 'Mol* · Prism', sub: 'in the web page', parts: '3 5' },
      { title: 'Seq*', sub: 'sequences, tracks, alignments', parts: '4' },
      { title: 'Stories · MVSX', sub: 'files and images to share', parts: '6' },
    ],
  },
];

/**
 * "Describe, don't click" (outline.md §2): data, descriptions (written in TypeScript or Python), viewers and outputs: three
 * tinted columns of cards of one size, one arrow between each two. With `current` (3–6) the cards that part deals with are
 * lit and the rest are quieter (still readable): the map at the start of parts 3–6; without it, all are the same.
 */
export function partsMap(current?: number): string {
  const arrow = `arrow-${++arrowCount}`;
  const panelX = [14, 349, 684] as const;
  const panelW = 262;
  const cardW = 230;
  const cardH = 62;
  const panelY = 10;
  const panelH = 322;
  const cardsY = 96;
  const gap = 14;
  const panels = Columns.map((col, c) => {
    const x = panelX[c];
    const cards = col.nodes
      .map((n, i) => {
        const cx = x + (panelW - cardW) / 2;
        const cy = cardsY + i * (cardH + gap);
        return `<g class="node" data-parts="${n.parts}"><rect class="dg-box" x="${cx}" y="${cy}" width="${cardW}" height="${cardH}" rx="10"/><text class="dg-title" x="${cx + 14}" y="${cy + 26}">${escapeHtml(n.title)}</text><text class="dg-sub" x="${cx + 14}" y="${cy + 47}">${escapeHtml(n.sub)}</text></g>`;
      })
      .join('');
    return `<g><rect class="dg-col dg-col-${c}" x="${x}" y="${panelY}" width="${panelW}" height="${panelH}" rx="14"/><text class="dg-head" x="${x + 16}" y="${panelY + 30}">${col.head}</text><text class="dg-note" x="${x + 16}" y="${panelY + 52}">${escapeHtml(col.note ?? '')}</text>${cards}</g>`;
  }).join('');
  // One arrow in each gap, at the middle of the cards.
  const midY = cardsY + (3 * cardH + 2 * gap) / 2;
  const arrows = [0, 1]
    .map((i) => {
      const from = panelX[i] + panelW + 6;
      const to = panelX[i + 1] - 6;
      return `<path class="dg-line" d="M${from} ${midY} H${to}" marker-end="url(#${arrow})"/>`;
    })
    .join('');
  const parts = current === undefined ? '' : ` data-current="${current}"`;
  return `<svg class="parts-map dg"${parts} viewBox="0 0 960 342" role="img" aria-label="Data, descriptions and viewers: descriptions turn data into views">
    ${arrowDefs(arrow)}${panels}${arrows}
  </svg>`;
}

/** The volume server's principle (outline.md §5): a large map, the box you ask for, the levels of detail. */
export function volumeServerDiagram(): string {
  const arrow = `arrow-${++arrowCount}`;
  // The map: a grid with a blob of density; three boxes (small, medium, the whole map) pick three levels.
  const gridLines: string[] = [];
  for (let i = 1; i < 12; i++) gridLines.push(`M${20 + i * 30} 50 V410`);
  for (let i = 1; i < 12; i++) gridLines.push(`M20 ${50 + i * 30} H380`);
  const level = (y: number, title: string, sub: string, step: number, size: string) => {
    const dots: string[] = [];
    const cols = Math.floor(130 / step);
    const rows = Math.floor(64 / step);
    for (let r = 0; r < rows; r++)
      for (let c = 0; c < cols; c++)
        dots.push(
          `<circle cx="${565 + c * step + step / 2}" cy="${y + 14 + r * step + step / 2}" r="${Math.max(1.6, step / 5)}"/>`,
        );
    return `<g class="node"><rect class="dg-box" x="540" y="${y}" width="400" height="92" rx="10"/><g class="dg-dots">${dots.join('')}</g><text class="dg-title" x="715" y="${y + 36}">${title}</text><text class="dg-sub" x="715" y="${y + 60}">${sub}</text><text class="dg-sub dg-faint" x="715" y="${y + 80}">${size}</text></g>`;
  };
  return `<svg class="volume-diagram dg" viewBox="0 0 960 440" role="img" aria-label="A large map, the box you ask for, and its levels of detail">
    ${arrowDefs(arrow)}
    <rect class="dg-col dg-col-0" x="6" y="4" width="388" height="432" rx="14"/>
    <rect class="dg-col dg-col-2" x="528" y="4" width="426" height="432" rx="14"/>
    <text class="dg-head" x="20" y="28">THE MAP, STORED ONCE</text>
    <text class="dg-head" x="540" y="28">LEVELS OF DETAIL, PRECOMPUTED</text>
    <rect class="dg-box" x="20" y="50" width="360" height="360" rx="10"/>
    <path class="dg-grid" d="${gridLines.join(' ')}"/>
    <ellipse class="dg-density" cx="205" cy="235" rx="95" ry="75"/>
    <ellipse class="dg-density" cx="170" cy="215" rx="40" ry="34"/>
    <rect class="dg-ask dg-ask-s" x="148" y="192" width="64" height="52" rx="3"/>
    <rect class="dg-ask dg-ask-m" x="108" y="152" width="170" height="140" rx="3"/>
    <rect class="dg-ask dg-ask-l" x="28" y="58" width="344" height="344" rx="6"/>
    <text class="dg-label" x="30" y="428">the box you ask for: small, medium, the whole map</text>
    ${level(50, 'Fine', 'small box, full resolution', 14, 'many voxels, a small region')}
    ${level(176, 'Medium', 'bigger box, every 2nd voxel', 26, 'fewer voxels, a larger region')}
    ${level(302, 'Coarse', 'whole map, every 4th voxel', 50, 'few voxels, the whole map')}
    <path class="dg-line dg-ask-s" d="M214 218 C380 150 420 130 536 96" marker-end="url(#${arrow})"/>
    <path class="dg-line dg-ask-m" d="M278 222 C400 230 430 230 536 222" marker-end="url(#${arrow})"/>
    <path class="dg-line dg-ask-l" d="M372 330 C440 340 480 348 536 348" marker-end="url(#${arrow})"/>
  </svg>`;
}
