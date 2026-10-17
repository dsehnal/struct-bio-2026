/**
 * Copyright (c) 2026 mol* contributors, licensed under MIT, See LICENSE file for more info.
 *
 * Developed in collaboration with Anyfold <https://anyfold.ai/>
 *
 * @author David Sehnal <david.sehnal@gmail.com>
 */

import { createEmbeddedViewer, type EmbeddedViewer } from '../viewer/index.js';
import { showScene, smallestScene } from '../viewer/scenes.js';

// Live slides (_spec/README.md decision 7): a section with `data-live` gets a Prism viewer in its `.live-viewer` when it
// is shown and loses it when it is left, so a deck of many live slides holds one WebGL context at a time. Each viewer
// is made without a `persist.key`, so there is no key to clash between the one being disposed and the next.

/** What a live slide shows once its viewer is up. */
type LiveScene = (viewer: EmbeddedViewer) => Promise<void>;

const LiveScenes: Readonly<Record<string, LiveScene>> = {
  'scene-1cbs': async (viewer) => {
    await showScene(viewer, smallestScene());
  },
};

interface Mounted {
  readonly slide: HTMLElement;
  readonly viewer: Promise<EmbeddedViewer | undefined>;
}

/** Keeps the live viewer of the current slide only. */
export class LiveSlides {
  #mounted: Mounted | undefined;
  /** Bumped on every change of slide, so a viewer that finishes after its slide was left is disposed. */
  #generation = 0;
  #queue: Promise<void> = Promise.resolve();

  /** The slide now shown (`undefined`: none); the previous live viewer is disposed first. */
  show(slide: HTMLElement | undefined): void {
    const id = slide?.dataset.live;
    if (this.#mounted?.slide === slide) return;
    const generation = ++this.#generation;
    // One at a time: the old viewer is gone before the next one is made.
    this.#queue = this.#queue.then(async () => {
      await this.#unmount();
      if (generation !== this.#generation || !slide || !id) return;
      await this.#mount(slide, id, generation);
    });
  }

  async #unmount() {
    const mounted = this.#mounted;
    this.#mounted = undefined;
    const viewer = await mounted?.viewer;
    await viewer?.dispose();
  }

  async #mount(slide: HTMLElement, id: string, generation: number) {
    const container = slide.querySelector<HTMLElement>('.live-viewer');
    const scene = LiveScenes[id];
    if (!container || !scene) {
      console.warn(`The live slide '${id}' has no .live-viewer or no scene.`);
      return;
    }
    const viewer = createEmbeddedViewer(container).then(
      async (v) => {
        if (generation !== this.#generation) {
          await v.dispose();
          return undefined;
        }
        // Not awaited: leaving the slide must not wait for a download (showScene reports its own failures).
        void scene(v);
        return v;
      },
      () => undefined,
    );
    this.#mounted = { slide, viewer };
    await viewer;
  }

  async dispose() {
    this.#generation++;
    await this.#queue;
    await this.#unmount();
  }
}
