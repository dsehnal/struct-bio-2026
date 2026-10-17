/**
 * Copyright (c) 2026 mol* contributors, licensed under MIT, See LICENSE file for more info.
 *
 * Developed in collaboration with Anyfold <https://anyfold.ai/>
 *
 * @author David Sehnal <david.sehnal@gmail.com>
 */

import { MVSData } from '@molstar/mvs-builder';
import { getSnippet } from '../examples/index.js';
import { runSnippet, runSvsSnippet } from '../runner/index.js';
import { createEmbeddedViewer } from '../viewer/index.js';
import { showScene } from '../viewer/scenes.js';
import { assetNames, dataHtml } from './data-files.js';
import { highlight } from './highlight.js';
import { escapeHtml, slide, tryItChip } from './html.js';
import type { LiveScene } from './live.js';

// The reusable code + viewer slide (outline.md §3–6): a snippet's code on the left, highlighted and big, a live viewer on
// the right that runs the snippet. An MVS snippet goes through `runSnippet` and `loadMvs`; an SVS snippet first shows its
// 3D scene (another snippet, `data-scene`), then `runSvsSnippet` and `loadSvs`, so the sequence band and the structure show
// the same example. The tabs switch the code to what it produced (MVSJ, or the SeqViewSpec document), which is the
// "description is data" point of the talk. A "try it" chip opens the playground at the snippet.

export interface SnippetSlideOptions {
  readonly part: number;
  readonly snippetId: string;
  /** The slide's title; the snippet's title when not given. */
  readonly title?: string;
  /** One line under the title; the snippet's summary when not given. */
  readonly lead?: string;
  /** An SVS snippet's 3D scene: the id of an MVS snippet. */
  readonly sceneId?: string;
  readonly notes: string;
}

/** The slide: code (static, highlighted when the deck is made), the tabs, the viewer's box and the "try it" chip. */
export function snippetSlide(o: SnippetSlideOptions): string {
  const snippet = getSnippet(o.snippetId);
  const produced = snippet?.kind === 'svs' ? 'SeqViewSpec' : 'MVSJ';
  const files = snippet ? assetNames(snippet.code) : [];
  const code = snippet
    ? `<pre class="code" data-pane="code"><code>${highlight(snippet.code.trim(), 'ts')}</code></pre>
       <pre class="code" data-pane="made" hidden><code>Run the snippet first.</code></pre>`
    : `<pre class="code" data-pane="code"><code>The snippet '${escapeHtml(o.snippetId)}' is not available.</code></pre>`;
  // The files the snippet reads: one sub-tab each (filled when the slide is shown).
  const data = files.length
    ? `<div class="data-pane" data-pane="data" hidden>
         <p class="data-note">The data is a separate file. The highlighted keys join each row to the structure.</p>
         ${files.length > 1 ? `<div class="code-tabs data-tabs">${files.map((f, i) => `<button type="button" class="${i === 0 ? 'active' : ''}" data-file="${escapeHtml(f)}">${escapeHtml(f)}</button>`).join('')}</div>` : `<span class="code-label data-name" data-file-name>${escapeHtml(files[0])}</span>`}
         <pre class="code wrap"><code>Loading the file…</code></pre>
       </div>`
    : '';
  return slide({
    part: o.part,
    className: 'live-slide code-live',
    data: { live: 'snippet', snippet: o.snippetId, ...(o.sceneId ? { scene: o.sceneId } : {}) },
    notes: o.notes,
    foot: tryItChip(o.snippetId),
    body: `
      <header class="slide-head">
        <h2>${escapeHtml(o.title ?? snippet?.title ?? o.snippetId)}</h2>
        <p class="lead">${escapeHtml(o.lead ?? snippet?.summary ?? '')}</p>
      </header>
      <div class="columns code-columns">
        <div class="code-box">
          <div class="code-tabs" role="tablist">
            <button type="button" role="tab" class="active" data-tab="code">Code</button>
            <button type="button" role="tab" data-tab="made" disabled>${produced}</button>
            ${files.length ? '<button type="button" role="tab" data-tab="data" disabled>Data</button>' : ''}
            <button type="button" class="widen" title="Give the code more room" aria-label="Wider code">⇔</button>
          </div>
          ${code}
          ${data}
        </div>
        <div class="live-viewer"></div>
      </div>`,
  });
}

/** "Line 7: message" for a failed run, as the playground says it. */
export function problemText(error: { message: string; line?: number }): string {
  return error.line ? `Line ${error.line}: ${error.message}` : error.message;
}

export const snippetScene: LiveScene = async (el) => {
  const id = el.dataset.snippet ?? '';
  const sceneId = el.dataset.scene;
  const container = el.querySelector<HTMLElement>('.live-viewer');
  const tabs = [...el.querySelectorAll<HTMLButtonElement>('.code-tabs:not(.data-tabs) button[data-tab]')];
  const panes = [...el.querySelectorAll<HTMLElement>('.code-box > [data-pane]')];
  const widen = el.querySelector<HTMLButtonElement>('.code-tabs .widen');
  const dataPane = el.querySelector<HTMLElement>('.data-pane');
  const dataCode = dataPane?.querySelector<HTMLElement>('pre code');
  const fileTabs = [...(dataPane?.querySelectorAll<HTMLButtonElement>('[data-file]') ?? [])];
  const dataTab = tabs.find((t) => t.dataset.tab === 'data');
  const texts = new Map<string, string>();
  const made = el.querySelector<HTMLElement>('pre[data-pane="made"] code');
  if (!container) throw new Error('The slide has no .live-viewer.');

  const select = (name: string) => {
    for (const t of tabs) t.classList.toggle('active', t.dataset.tab === name);
    for (const p of panes) p.hidden = p.dataset.pane !== name;
  };
  const onTab = (e: Event) => {
    const button = e.currentTarget as HTMLButtonElement;
    select(button.dataset.tab ?? 'code');
    // A focused button would not take the deck's keys.
    button.blur();
  };
  for (const t of tabs) t.addEventListener('click', onTab);
  const onWiden = (e: Event) => {
    el.classList.toggle('code-wide');
    (e.currentTarget as HTMLElement).blur();
  };
  widen?.addEventListener('click', onWiden);
  const showFile = (name: string) => {
    for (const t of fileTabs) t.classList.toggle('active', t.dataset.file === name);
    if (dataCode) dataCode.innerHTML = dataHtml(name, texts.get(name) ?? '');
  };
  const onFile = (e: Event) => {
    const b = e.currentTarget as HTMLButtonElement;
    showFile(b.dataset.file ?? '');
    b.blur();
  };
  for (const t of fileTabs) t.addEventListener('click', onFile);

  const viewer = await createEmbeddedViewer(container);
  let disposed = false;
  const fail = (message: string) => {
    if (!disposed) viewer.setStatus(message, 'error');
  };
  const showMade = (text: string, language: 'json') => {
    if (!made || disposed) return;
    made.innerHTML = highlight(text, language);
    const tab = tabs.find((t) => t.dataset.tab === 'made');
    if (tab) tab.disabled = false;
  };

  // The data files the snippet reads, fetched from the page's `data/` folder (what `asset(name)` is).
  if (dataPane && dataCode) {
    const names = fileTabs.length
      ? fileTabs.map((t) => t.dataset.file ?? '')
      : [dataPane.querySelector<HTMLElement>('[data-file-name]')?.textContent ?? ''];
    void Promise.all(
      names.map(async (name) => {
        const response = await fetch(new URL(`data/${name}`, location.href.split('#')[0]));
        if (!response.ok) throw new Error(`${name}: ${response.status}`);
        texts.set(name, await response.text());
      }),
    ).then(
      () => {
        if (disposed) return;
        showFile(names[0]);
        if (dataTab) dataTab.disabled = false;
      },
      (e: unknown) => console.warn('The data files could not be read.', e),
    );
  }

  // In the background: leaving the slide must not wait for a download.
  void (async () => {
    const snippet = getSnippet(id);
    if (!snippet) return fail(`The snippet '${id}' is not available.`);
    viewer.setStatus('Running the snippet…');
    if (snippet.kind === 'mvs') {
      const result = await runSnippet(snippet.code);
      if (disposed) return;
      if (!result.ok) return fail(problemText(result.error));
      showMade(MVSData.toMVSJ(result.mvs, 2), 'json');
      await showScene(viewer, result.mvs);
      return;
    }
    // SVS: the 3D scene first, then the sequence band's document.
    const scene = sceneId ? getSnippet(sceneId) : undefined;
    if (scene) {
      const base = await runSnippet(scene.code);
      if (disposed) return;
      if (!base.ok) return fail(`${scene.title}: ${problemText(base.error)}`);
      if (!(await showScene(viewer, base.mvs)) || disposed) return;
    }
    viewer.setStatus('Running the snippet…');
    const result = await runSvsSnippet(snippet.code);
    if (disposed) return;
    if (!result.ok) return fail(problemText(result.error));
    showMade(JSON.stringify(result.svs, undefined, 2), 'json');
    try {
      await viewer.loadSvs(result.svs);
      if (!disposed) viewer.setStatus(undefined);
    } catch (e) {
      console.error(e);
      fail(`Could not load the sequence view: ${e instanceof Error ? e.message : String(e)}`);
    }
  })().catch((e) => {
    console.error(e);
    fail(String(e));
  });

  return async () => {
    disposed = true;
    for (const t of tabs) t.removeEventListener('click', onTab);
    widen?.removeEventListener('click', onWiden);
    for (const t of fileTabs) t.removeEventListener('click', onFile);
    el.classList.remove('code-wide');
    if (dataTab) dataTab.disabled = true;
    select('code');
    // The next visit runs the snippet again.
    if (made) made.textContent = 'Run the snippet first.';
    const madeTab = tabs.find((t) => t.dataset.tab === 'made');
    if (madeTab) madeTab.disabled = true;
    await viewer.dispose();
  };
};
