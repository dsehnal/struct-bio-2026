/**
 * Copyright (c) 2026 mol* contributors, licensed under MIT, See LICENSE file for more info.
 *
 * Developed in collaboration with Anyfold <https://anyfold.ai/>
 *
 * @author David Sehnal <david.sehnal@gmail.com>
 */

// Brings the `snapshot` area's types onto `viewer.api` (as `viewer/index.ts` does for the loaders).
import '@molstar/prism-viewer/features/snapshots';
import { getSnippet } from '../examples/index.js';
import { runSnippet } from '../runner/index.js';
import { createEmbeddedViewer } from '../viewer/index.js';
import { showScene } from '../viewer/scenes.js';
import { escapeHtml, slide, tryItChip } from './html.js';
import type { LiveScene } from './live.js';
import { problemText } from './snippet.js';

// The story slide (outline.md §6, example C): a multi-snapshot MVS loaded into Prism, stepped by the deck's own arrows. Once
// the story has loaded, the scene adds one reveal fragment per snapshot after the first, so → shows the next snapshot and ←
// the previous (the snapshot is applied by the viewer's `snapshot.apply`, with the camera move the story asks for). The list
// beside the viewer is the story's own: each snapshot's title, and the current one's text.

export interface StorySlideOptions {
  readonly part: number;
  readonly snippetId: string;
  readonly title: string;
  readonly lead: string;
  readonly notes: string;
}

export function storySlide(o: StorySlideOptions): string {
  return slide({
    part: o.part,
    className: 'live-slide story-live',
    data: { live: 'story', snippet: o.snippetId },
    notes: o.notes,
    foot: tryItChip(o.snippetId),
    body: `
      <header class="slide-head">
        <h2>${escapeHtml(o.title)}</h2>
        <p class="lead">${escapeHtml(o.lead)}</p>
      </header>
      <div class="story-columns">
        <div class="live-viewer"></div>
        <aside class="story-panel"><p class="story-hint">Running the story…</p><ol class="story-steps"></ol></aside>
      </div>`,
  });
}

/** Markdown of a snapshot's text, reduced to what the panel shows: paragraphs, bold and plain links. */
function textOf(markdown: string): string {
  return markdown
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) =>
      escapeHtml(p)
        .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
        .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
        .replace(/\n/g, ' '),
    )
    .map((p) => `<p>${p}</p>`)
    .join('');
}

export const storyScene: LiveScene = async (el, deck) => {
  const id = el.dataset.snippet ?? '';
  const container = el.querySelector<HTMLElement>('.live-viewer');
  const list = el.querySelector<HTMLOListElement>('.story-steps');
  const hint = el.querySelector<HTMLElement>('.story-hint');
  const deckRoot = el.closest<HTMLElement>('.reveal');
  if (!container || !list || !hint || !deckRoot) throw new Error('The story slide is missing a part.');

  const viewer = await createEmbeddedViewer(container);
  let disposed = false;
  let entries: readonly { readonly id: string; readonly name: string; readonly description?: string }[] = [];
  const fragments: HTMLElement[] = [];
  let shown = 0;

  const paint = () => {
    [...list.children].forEach((li, i) => {
      li.classList.toggle('current', i === shown);
      li.classList.toggle('past', i < shown);
    });
  };
  // The step is the number of the slide's story fragments that are shown.
  const onFragment = () => {
    const step = fragments.filter((f) => f.classList.contains('visible')).length;
    if (step === shown || disposed) return;
    shown = step;
    paint();
    const entry = entries[step];
    if (entry) void viewer.viewer.api.snapshot.apply({ entry: entry.id }).catch((e: unknown) => console.error(e));
  };
  deckRoot.addEventListener('fragmentshown', onFragment);
  deckRoot.addEventListener('fragmenthidden', onFragment);

  void (async () => {
    const snippet = getSnippet(id);
    if (!snippet) throw new Error(`The snippet '${id}' is not available.`);
    viewer.setStatus('Running the story…');
    const result = await runSnippet(snippet.code);
    if (disposed) return;
    if (!result.ok) throw new Error(problemText(result.error));
    if (!(await showScene(viewer, result.mvs)) || disposed) return;
    const listed = await viewer.viewer.api.snapshot.list();
    if (disposed) return;
    entries = (listed.ok ? listed.value?.entries : undefined) ?? [];
    if (entries.length === 0) throw new Error('The story has no snapshots.');
    list.innerHTML = entries
      .map(
        (e, i) =>
          `<li><span class="story-title">${escapeHtml(e.name || `Snapshot ${i + 1}`)}</span><div class="story-text">${textOf(e.description ?? '')}</div></li>`,
      )
      .join('');
    hint.hidden = true;
    // One fragment per snapshot after the first.
    for (let i = 1; i < entries.length; i++) {
      const f = document.createElement('span');
      f.className = 'fragment story-step';
      f.dataset.fragmentIndex = String(i);
      el.appendChild(f);
      fragments.push(f);
    }
    deck.syncFragments(el);
    shown = 0;
    paint();
    // Back on the slide with the fragments in their old state is not possible (they were removed at dispose), so the
    // viewer's first snapshot and step 0 agree.
  })().catch((e) => {
    console.error(e);
    if (disposed) return;
    hint.textContent = String(e instanceof Error ? e.message : e);
    viewer.setStatus(String(e instanceof Error ? e.message : e), 'error');
  });

  return async () => {
    disposed = true;
    deckRoot.removeEventListener('fragmentshown', onFragment);
    deckRoot.removeEventListener('fragmenthidden', onFragment);
    for (const f of fragments) f.remove();
    deck.syncFragments(el);
    list.replaceChildren();
    hint.hidden = false;
    hint.textContent = 'Running the story…';
    await viewer.dispose();
  };
};
