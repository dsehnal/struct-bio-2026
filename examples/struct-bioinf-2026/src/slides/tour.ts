/**
 * Copyright (c) 2026 mol* contributors, licensed under MIT, See LICENSE file for more info.
 *
 * Developed in collaboration with Anyfold <https://anyfold.ai/>
 *
 * @author David Sehnal <david.sehnal@gmail.com>
 */

// Bring the `canvas.lighting` and `export` areas' types onto `viewer.api` (as `viewer/index.ts` does for the loaders).
import { Vec3 } from '@molstar/core/math/linear-algebra';
import '@molstar/prism-viewer/features/canvas-settings';
import type { SceneNode } from '@molstar/prism-viewer/model/scene';
import type { EmbeddedViewer } from '../viewer/index.js';
import { MoveSectionId } from '@molstar/prism-viewer/features/structure-move';
import { createTourViewer, VideoSection } from '../viewer/tour.js';
import { escapeHtml, notes, slide } from './html.js';
import type { LiveScene } from './live.js';

// The Prism tour (outline.md §1): the full viewer with 1IEP (and its density in the Volumes step only) beside a list
// of what is better in Prism. A reveal fragment per item after the first (→ and ←): each step puts the viewer in the state
// that shows the item, through the public API (`viewer.api`, the command manager), then the list highlights it. A step is a
// pose, set whole from a clean base, so stepping back and forth lands in the same place. If a step cannot be driven the
// panel is shown and the notes say what to click.

type Api = EmbeddedViewer['viewer']['api'];

/** The ligand's density: 2Fo-Fc at this level (σ) when the Volumes step shows it, then moved up and back. */
const IsoStart = 1.5;
const IsoHigh = 3;

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/** Calls an operation and says on the console when it does not work (a step must not stop the tour). */
async function call(what: string, run: () => Promise<{ ok: boolean; message?: string }> | undefined) {
  try {
    const r = await run();
    if (r && !r.ok) console.warn(`Tour: ${what}: ${r.message}`);
  } catch (e) {
    console.warn(`Tour: ${what} failed.`, e);
  }
}

export const tourScene: LiveScene = async (el, deck) => {
  const container = el.querySelector<HTMLElement>('.live-viewer');
  const items = [...el.querySelectorAll<HTMLElement>('.tour-list li')];
  const steps = [...el.querySelectorAll<HTMLElement>('.tour-step')];
  const deckRoot = el.closest<HTMLElement>('.reveal');
  if (!container || !deckRoot) throw new Error('The tour slide is missing a part.');
  const embedded = await createTourViewer(container);
  const { viewer } = embedded;
  const api: Api = viewer.api;
  const scene = viewer.views.scene;
  let disposed = false;
  let ready = false;
  /** Bumped by every pose; a pose that finds itself outdated stops. */
  let turn = 0;
  let shown = 0;

  const paint = () => items.forEach((li, i) => li.classList.toggle('current', i === shown));

  /** A row of the scene tree (by its label), picked the way a click picks it: its inspector opens, its ancestors expanded. */
  const pickRow = (label: string, expand = false) => {
    const find = (list: readonly SceneNode[]): SceneNode | undefined => {
      for (const n of list) {
        if (n.label.value === label) return n;
        const below = find(n.children.value);
        if (below) return below;
      }
      return undefined;
    };
    const node = find(scene.roots.value);
    if (!node || !scene.reveal?.(node.id)) {
      console.warn(`Tour: there is no '${label}' row in the scene tree.`);
      return;
    }
    // Opened as a click on its arrow opens it (a lazy row computes its children then).
    if (expand && !node.isExpanded.value) node.toggleExpanded();
  };

  /**
   * The density is the Volumes step's alone: its streaming node is in the tree only then (hidden, it would still count in
   * the scene's bounds). On: streaming, its box around the focus (the gatekeeper), and the focus set again, as the box is
   * computed when the focus changes. Off: the node removed.
   */
  const density = async (on: boolean) => {
    if (!on) return call('density off', () => api.volume.streaming({ on: false }));
    await call('density on', () => api.volume.streaming({ on: true }));
    await call('density view', () =>
      api.volume.streamingView({ view: 'selection-box', radius: 10, channels: { '2fo-fc': { isoValue: IsoStart } } }),
    );
    await call('focus clear', () => api.focus.clear({}));
    await call('focus', () => api.focus.set({ target: 'A:315' }));
  };

  /** The clean state every pose starts from: nothing selected or styled, no panel, no density (only Volumes shows it). */
  async function base() {
    closeCommandMenu(container as HTMLElement);
    viewer.managers.commands.cancel();
    scene.pick(undefined);
    await call('select.clear', () => api.select.clear());
    await call('reset layers', () => api.representation.reset({ layer: 'all' }));
    await call('lighting', () => api.canvas.lighting({ occlusion: { name: 'off' }, outline: { name: 'off' } }));
    // the structure alone: the density belongs to the Volumes step
    await density(false);
    await call('reset transform', () => api.structure.transformReset({}));
    // The right dock and any card only: `view.close` closes every dock, the sequence band's (the top one) too.
    viewer.managers.navigation.setCard(undefined);
    viewer.managers.navigation.setDock('right', { collapsed: true });
  }

  const poses: readonly ((alive: () => boolean) => Promise<void>)[] = [
    // 1. The structure tree.
    async () => {
      await call('camera', () => api.camera.reset({}));
      await call('open Structure', () => api.view.open({ tab: 'structure' }));
      pickRow('Contents', true);
    },
    // 2. Volumes: the iso value moves up and back, in σ.
    async (alive) => {
      // the density around the focus (the gatekeeper, beside imatinib), at its start level
      await density(true);
      await call('camera', () => api.camera.frame({ target: 'ligand' }));
      await call('open Structure', () => api.view.open({ tab: 'structure' }));
      pickRow('Volume streaming');
      for (const level of [2, IsoHigh, 2, IsoStart]) {
        await sleep(900);
        if (!alive()) return;
        await call('iso', () => api.volume.streamingView({ channels: { '2fo-fc': { isoValue: level } } }));
      }
    },
    // 3. Better selection: build it (the ligand), grow it (5 Å), change it (add the gatekeeper).
    async (alive) => {
      await call('camera', () => api.camera.frame({ target: 'ligand' }));
      await call('open Selection', () => api.view.open({ tab: 'selection' }));
      await call('select ligand', () => api.select.set({ target: 'ligand' }));
      await sleep(1300);
      if (!alive()) return;
      await call('grow', () => api.select.around({ radius: 5 }));
      await sleep(1300);
      if (!alive()) return;
      await call('add T315', () => api.select.set({ target: 'A:315', mode: 'add' }));
    },
    // 4. Selection visuals: the selection's style section, with a color and a glow on it.
    async () => {
      await call('camera', () => api.camera.frame({ target: 'ligand' }));
      await call('select pocket', () => api.select.set({ target: 'ligand' }));
      await call('grow', () => api.select.around({ radius: 5 }));
      await call('open style', () => api.view.open({ tab: 'selection', section: 'selection-style' }));
      await call('color', () => api.representation.color({ target: 'selection', color: '#e76f51' }));
      await call('glow', () => api.representation.emissive({ target: 'selection', strength: 0.4 }));
    },
    // 5. Moving structures: the Move section shows handles on the structure in 3D (drag to move or turn it); here it
    // turns by a few degrees, as a drag would.
    async (alive) => {
      await call('camera', () => api.camera.reset({}));
      await call('open Move', () => api.view.open({ tab: 'selection', section: MoveSectionId }));
      await sleep(900);
      if (!alive()) return;
      await call('turn', () => api.structure.transform({ axis: Vec3.create(0, 1, 0), angle: 25 }));
      await sleep(300);
      if (!alive()) return;
      // the whole structure in view, with its handles
      await call('camera', () => api.camera.reset({}));
    },
    // 6. Nicer screenshots: lighting (occlusion, outline) on, the Export card at its Image section, then its Animation section
    // (MP4 or WebM): the extension is loaded when the section is asked for.
    async (alive) => {
      await call('camera', () => api.camera.frame({ target: 'ligand' }));
      await call('lighting', () => api.canvas.lighting({ occlusion: { name: 'on' }, outline: { name: 'on' } }));
      await call('open export', () =>
        api.view.open({ card: 'core.overlay.export', section: 'export-image.section.image' }),
      );
      await sleep(3200);
      if (!alive()) return;
      await call('open animation', () =>
        api.view.open({ card: 'core.overlay.export', section: `export-image.section.image/${VideoSection}` }),
      );
    },
    // 7. The sequence viewer: a residue range selected in 3D is lit in the sequence (and the reverse).
    async () => {
      await call('camera', () => api.camera.reset({}));
      await call('select DFG', () => api.select.set({ target: 'A:380-385' }));
    },
    // 8. The command menu, on its first screen (Browse, then Data, …): the palette button's own action, as a click on it.
    async () => {
      await call('camera', () => api.camera.reset({}));
      const palette = viewer.views.shell?.toolbar.value.find((i) => i.id === 'palette');
      if (palette?.run) palette.run(container);
      else console.warn('Tour: the viewer has no command menu button.');
      // The menu takes the focus to its search field, where ← and → would stay; give it back to the page, so the
      // arrows still step the deck. A click in the menu takes it again.
      await sleep(100);
      blurInside(container as HTMLElement);
    },
  ];

  const pose = async (n: number) => {
    const mine = ++turn;
    const alive = () => !disposed && mine === turn;
    await base();
    if (!alive()) return;
    await poses[n](alive);
  };

  const onFragment = () => {
    const n = steps.filter((f) => f.classList.contains('visible')).length;
    if (n === shown) return;
    shown = n;
    paint();
    if (ready) void pose(n);
  };
  deckRoot.addEventListener('fragmentshown', onFragment);
  deckRoot.addEventListener('fragmenthidden', onFragment);
  // A click on an item goes to its step: item n is shown once n fragments are (the first by none); reveal counts its
  // fragments from 0, so that is fragment n - 1. The deck, the list and the viewer move as with the arrows.
  const onItem = (e: MouseEvent) => {
    const li = (e.target as HTMLElement).closest<HTMLElement>('.tour-list li');
    if (!li) return;
    const { h, v } = deck.getIndices();
    deck.slide(h, v, Number(li.dataset.step) - 1);
  };
  el.addEventListener('click', onItem);
  shown = steps.filter((f) => f.classList.contains('visible')).length;
  paint();

  // The scene: 1IEP (its density is the Volumes step's), then the first pose.
  void (async () => {
    embedded.setStatus('Loading 1IEP…');
    try {
      await embedded.loadEntry('pdb', '1iep');
      if (disposed) return;
      // A focus on a protein residue next to the ligand keeps the sequence band on the protein (a focus on the ligand would
      // take it away); the Volumes step's density is around it.
      await call('focus', () => api.focus.set({ target: 'A:315' }));
      await call('reset camera', () => api.camera.reset({ animate: false }));
      embedded.setStatus(undefined);
    } catch (e) {
      console.error(e);
      if (!disposed) embedded.setStatus(`Could not load 1IEP: ${e instanceof Error ? e.message : String(e)}`, 'error');
      return;
    }
    ready = true;
    await pose(shown);
  })();

  return async () => {
    disposed = true;
    deckRoot.removeEventListener('fragmentshown', onFragment);
    deckRoot.removeEventListener('fragmenthidden', onFragment);
    el.removeEventListener('click', onItem);
    await embedded.dispose();
  };
};

/**
 * Closes the command menu if it is open (step 7 leaves it so, and ← must not carry it into step 6): Escape on the menu,
 * as a person would press it. The shell keeps the menu's open state to itself, with no public close; its root is open.
 */
function closeCommandMenu(container: HTMLElement) {
  for (const host of container.querySelectorAll<HTMLElement>('*')) {
    const menu = host.shadowRoot?.querySelector<HTMLElement>('[role="dialog"][aria-label="Commands"]');
    menu?.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, composed: true, cancelable: true }),
    );
  }
}

/** Takes the focus from whatever has it inside the viewer's shadow roots. */
function blurInside(container: HTMLElement) {
  for (const host of container.querySelectorAll<HTMLElement>('*')) {
    const active = host.shadowRoot?.activeElement;
    if (active instanceof HTMLElement) active.blur();
  }
}

const Items: readonly { title: string; text: string }[] = [
  { title: 'The structure tree', text: 'The scene, in plain words.' },
  { title: 'Volumes', text: 'Density and its iso value.' },
  { title: 'Better selection', text: 'Build, grow and change it.' },
  { title: 'Selection visuals', text: 'How a selection is shown.' },
  { title: 'Moving structures', text: 'Handles in 3D. New.' },
  { title: 'Images and animations', text: 'Lighting, outlines, MP4 or WebM.' },
  { title: 'Sequence viewer (Seq*)', text: 'Linked to 3D, both ways.' },
  { title: 'The command menu', text: 'Type what you want.' },
];

export function tourSlide(part: number): string {
  return slide({
    part,
    className: 'live-slide tour-live',
    data: { live: 'tour' },
    notes: notes(
      'What is better in Prism: eight things, one per step. Press the right arrow: each step puts the viewer in the state that shows the item, and the list highlights it. The viewer is 1IEP, c-Abl kinase with imatinib, with its 2Fo-Fc density streamed around the pocket. Every step goes through the same named operations as a click, so you can also do each one by hand, and ← goes back to the step before.',
      '- <strong>1. The structure tree</strong>: the Structure tab says what is in the scene in plain words. The Contents row is expanded and picked, as if you had clicked it: the structure has four entities, and they have their real names from the file (the ABL kinase polymer, a chloride ion, imatinib with its long chemical name, water). Click any row to see its inspector.',
      '- <strong>2. Volumes</strong>: the Volume streaming row is picked, and its inspector shows the 2Fo-Fc and Fo-Fc channels with the histogram and the iso value. The iso value moves from 1.5 to 3 σ and back, and the density follows. By hand: drag the iso handle on the histogram. The density comes from the volume server around what the view looks at.',
      '- <strong>3. Better selection</strong>: the Selection tab. The ligand is selected (built), then grown by 5 Å, then the gatekeeper T315 is added (changed). The summary at the top says what is selected, in words, and the selection is shown in 3D and in the sequence. By hand: the Selection field takes <code>ligand</code>, <code>A:315</code>, a PyMOL selection; the buttons grow it, expand it to residues or chains, invert it.',
      '- <strong>4. Selection visuals</strong>: how a selection is shown, and how to change that. The "Color, transparency, glow" section of the Selection tab is open, and the pocket has a colour and a glow on it; the list under it shows the applied layers, each removable, with Clear all. The colours of the selection and the highlight are in Settings, Appearance.',
      '- <strong>5. Moving structures</strong> (new): the Move section of the Selection tab shows handles on the structure in 3D; drag them to move or turn it, for example to place two structures side by side. Here it turns by 25 degrees, as a drag would.',
      '- <strong>6. Images and animations</strong>: the Export card. Lighting is on (occlusion and an outline) for a nicer picture. First the Image part: a preview with a crop, the resolution, PNG, Copy or Download. Then the Animation part of the same card: the animation (camera spin, rock, snapshots), its length and frame rate, and the <strong>format: MP4 or WebM</strong>, with a quality choice. The animation export is a lazy extension: its code loads when this part is first opened.',
      "- <strong>7. The sequence viewer (Seq*)</strong>: the band at the top. Six residues around the DFG motif are selected, and they light up in the sequence as well as in 3D. By hand: hover a residue in the band and it lights in 3D, click or drag to select, and the reverse. Tracks, colours and the rail are in the Sequence button's menu.",
      '- <strong>8. The command menu</strong> (Ctrl or ⌘ + K): the first screen is open, with Browse (Preset, Styles, Select…), then Data (Open files…), and the rest. Type what you want and it filters. A next click: open Select, type <code>ligand</code> and press Enter.',
      'Press → once more to leave the tour. The earlier steps are not undone by leaving: the next slide has its own viewer.',
    ),
    body: `
      <header class="slide-head">
        <h2>What's better in Prism</h2>
        <p class="lead">Press → to step through. The viewer shows each one.</p>
      </header>
      <div class="tour-columns">
        <div class="live-viewer"></div>
        <ol class="tour-list">${Items.map((i, n) => `<li data-step="${n}"><strong>${escapeHtml(i.title)}</strong><span>${escapeHtml(i.text)}</span></li>`).join('')}</ol>
      </div>
      ${Items.slice(1)
        .map((_, n) => `<span class="fragment tour-step" data-fragment-index="${n + 1}"></span>`)
        .join('')}`,
  });
}
