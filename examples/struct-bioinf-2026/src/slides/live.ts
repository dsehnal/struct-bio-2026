/**
 * Copyright (c) 2026 mol* contributors, licensed under MIT, See LICENSE file for more info.
 *
 * Developed in collaboration with Anyfold <https://anyfold.ai/>
 *
 * @author David Sehnal <david.sehnal@gmail.com>
 */

import { createEmbeddedViewer } from '../viewer/index.js';
import { showScene, smallestScene } from '../viewer/scenes.js';
import { morphScene } from './morph.js';

// Live slides (_spec/README.md decision 7): a section with `data-live` gets its live parts when it is shown and loses
// them when it is left. A slide's scene function gets the slide, mounts what it needs (one viewer, or several: the
// morph slide has two) and returns one dispose. One live slide at a time, so a deck of many holds the WebGL contexts
// of one slide only. Viewers are made without a `persist.key`, so there is no key to clash between a slide being
// disposed and the next.

/** Frees everything a live slide mounted. */
export type DisposeLiveScene = () => void | Promise<void>;

/**
 * Mounts a live slide's parts and resolves when they exist (not when their data has loaded: leaving the slide must not
 * wait for a download, so loading goes on in the background and stops with the dispose). If it throws, it has freed
 * what it made.
 */
export type LiveScene = (slide: HTMLElement) => Promise<DisposeLiveScene>;

const LiveScenes: Readonly<Record<string, LiveScene>> = {
  'scene-1cbs': async (slide) => {
    const container = slide.querySelector<HTMLElement>('.live-viewer');
    if (!container) throw new Error('The slide has no .live-viewer.');
    const viewer = await createEmbeddedViewer(container);
    // Not awaited (showScene reports its own failures).
    void showScene(viewer, smallestScene());
    return () => viewer.dispose();
  },
  'morph-1iep': morphScene,
};

interface Mounted {
  readonly slide: HTMLElement;
  readonly dispose: Promise<DisposeLiveScene | undefined>;
}

/** Keeps the live parts of the current slide only. */
export class LiveSlides {
  #mounted: Mounted | undefined;
  /** Bumped on every change of slide, so a scene that finishes after its slide was left is disposed. */
  #generation = 0;
  #queue: Promise<void> = Promise.resolve();

  /** The slide now shown (`undefined`: none); the previous live slide is disposed first. */
  show(slide: HTMLElement | undefined): void {
    const id = slide?.dataset.live;
    if (this.#mounted?.slide === slide) return;
    const generation = ++this.#generation;
    // One at a time: the old viewers are gone before the next ones are made.
    this.#queue = this.#queue.then(async () => {
      await this.#unmount();
      if (generation !== this.#generation || !slide || !id) return;
      await this.#mount(slide, id, generation);
    });
  }

  async #unmount() {
    const mounted = this.#mounted;
    this.#mounted = undefined;
    const dispose = await mounted?.dispose;
    try {
      await dispose?.();
    } catch (e) {
      console.error('A live slide could not be disposed.', e);
    }
  }

  async #mount(slide: HTMLElement, id: string, generation: number) {
    const scene = LiveScenes[id];
    if (!scene) {
      console.warn(`The live slide '${id}' has no scene.`);
      return;
    }
    const dispose = scene(slide).then(
      async (dispose) => {
        if (generation !== this.#generation) {
          await dispose();
          return undefined;
        }
        return dispose;
      },
      (e) => {
        console.error(`The live slide '${id}' could not start.`, e);
        return undefined;
      },
    );
    this.#mounted = { slide, dispose };
    await dispose;
  }

  async dispose() {
    this.#generation++;
    await this.#queue;
    await this.#unmount();
  }
}
