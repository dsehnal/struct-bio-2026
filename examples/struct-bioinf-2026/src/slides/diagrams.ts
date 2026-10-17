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

const Data: readonly MapNode[] = [
  { title: 'PDBe · AlphaFold · EMDB', sub: 'structures, models, maps', parts: '3' },
  { title: 'Volume server', sub: 'density by region and detail', parts: '5' },
  { title: 'Annotations', sub: 'CIF, JSON, UniProt tables', parts: '3 4' },
];
const Descriptions: readonly MapNode[] = [
  { title: 'MolViewSpec', sub: '3D scenes and stories', parts: '3 5 6' },
  { title: 'SeqViewSpec', sub: 'sequence views', parts: '4' },
  { title: 'MolQL · SeqQL', sub: 'what to select', parts: '3 4' },
];
const Viewers: readonly MapNode[] = [
  { title: 'Mol* · Prism', sub: 'in the web page', parts: '3 5' },
  { title: 'Seq*', sub: 'sequences, tracks, alignments', parts: '4' },
  { title: 'Notebooks', sub: 'Python molviewspec', parts: '3' },
  { title: 'Stories · MVSX · images', sub: 'to share and publish', parts: '6' },
];

/**
 * "Describe, don't click" (outline.md §2): data, descriptions, viewers. With `current` (3–6) the boxes that part deals
 * with are highlighted and the rest fades (the map at the start of parts 3–6); without it, all are the same.
 */
export function partsMap(current?: number): string {
  const arrow = `arrow-${++arrowCount}`;
  const colX = [18, 349, 680] as const;
  const w = 262;
  const column = (nodes: readonly MapNode[], x: number, h: number, gap: number) =>
    nodes.map((n, i) => {
      const y = 52 + i * (h + gap);
      return {
        cy: y + h / 2,
        svg: `<g class="node" data-parts="${n.parts}"><rect class="dg-box" x="${x}" y="${y}" width="${w}" height="${h}" rx="10"/><text class="dg-title" x="${x + 16}" y="${y + h / 2 - 3}">${escapeHtml(n.title)}</text><text class="dg-sub" x="${x + 16}" y="${y + h / 2 + 19}">${escapeHtml(n.sub)}</text></g>`,
      };
    });
  const data = column(Data, colX[0], 72, 24);
  const descriptions = column(Descriptions, colX[1], 72, 24);
  const viewers = column(Viewers, colX[2], 58, 14);
  // A bus between two columns (every box on the left feeds every box on the right); each right-hand line ends in its own
  // arrowhead, as a marker on a multi-segment path marks only its last segment.
  const heads = (right: typeof data, x: number, to: number) =>
    right.map((n) => `<path class="dg-line" d="M${x} ${n.cy} H${to - 3}" marker-end="url(#${arrow})"/>`).join('');
  const bus = (left: typeof data, right: typeof data, from: number, to: number) => {
    const x = (from + to) / 2;
    const ys = [...left.map((n) => n.cy), ...right.map((n) => n.cy)];
    return `<path class="dg-line" d="${left.map((n) => `M${from} ${n.cy} H${x}`).join(' ')} M${x} ${Math.min(...ys)} V${Math.max(...ys)}"/>${heads(right, x, to)}`;
  };
  const heading = (x: number, text: string) => `<text class="dg-head" x="${x}" y="28">${text}</text>`;
  const parts = current === undefined ? '' : ` data-current="${current}"`;
  return `<svg class="parts-map dg"${parts} viewBox="0 0 960 350" role="img" aria-label="Data, descriptions and viewers: descriptions turn data into views">
    ${arrowDefs(arrow)}
    ${heading(colX[0], 'DATA')}${heading(colX[1], 'DESCRIPTIONS')}${heading(colX[2], 'VIEWERS')}
    ${bus(data, descriptions, colX[0] + w, colX[1])}
    ${bus(descriptions, viewers, colX[1] + w, colX[2])}
    ${data.map((n) => n.svg).join('')}${descriptions.map((n) => n.svg).join('')}${viewers.map((n) => n.svg).join('')}
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

/** Every button is an operation (outline.md §1): three ways in, one set of named operations, one scene and history. */
export function operationsDiagram(): string {
  const arrow = `arrow-${++arrowCount}`;
  const caller = (y: number, title: string, sub: string) =>
    `<g class="node"><rect class="dg-box" x="20" y="${y}" width="270" height="72" rx="10"/><text class="dg-title" x="38" y="${y + 33}">${title}</text><text class="dg-sub" x="38" y="${y + 56}">${sub}</text></g>`;
  const line = (y: number) => `<path class="dg-line" d="M290 ${y} H370" marker-end="url(#${arrow})"/>`;
  return `<svg class="operations-diagram dg" viewBox="0 0 960 300" role="img" aria-label="The UI, scripts and the assistant call the same named operations">
    ${arrowDefs(arrow)}
    ${caller(24, 'The UI', 'buttons, menus, commands')}
    ${caller(114, 'Scripts and pages', 'viewer.api.load.mvs(…)')}
    ${caller(204, 'The assistant', 'asks for the same operations')}
    ${line(60)}${line(150)}${line(240)}
    <g class="node dg-core"><rect class="dg-box" x="375" y="24" width="270" height="252" rx="10"/>
      <text class="dg-title" x="395" y="66">Named operations</text>
      <text class="dg-code" x="395" y="108">load.entry</text><text class="dg-code" x="395" y="138">structure.show</text>
      <text class="dg-code" x="395" y="168">style.color</text><text class="dg-code" x="395" y="198">snapshot.add</text>
      <text class="dg-sub" x="395" y="248">a name and parameters each</text></g>
    <path class="dg-line" d="M645 150 H700" marker-end="url(#${arrow})"/>
    <g class="node"><rect class="dg-box" x="705" y="24" width="235" height="252" rx="10"/>
      <text class="dg-title" x="723" y="66">The scene</text><text class="dg-sub" x="723" y="96">what is on screen</text>
      <text class="dg-title" x="723" y="160">The history</text><text class="dg-sub" x="723" y="190">every step, undoable</text></g>
  </svg>`;
}
