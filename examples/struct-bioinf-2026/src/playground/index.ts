/**
 * Copyright (c) 2026 mol* contributors, licensed under MIT, See LICENSE file for more info.
 *
 * Developed in collaboration with Anyfold <https://anyfold.ai/>
 *
 * @author David Sehnal <david.sehnal@gmail.com>
 */

import {
  type Example,
  editsOf,
  Examples,
  exampleOf,
  getSnippet,
  type Snippet,
  type SuggestedEdit,
} from '../examples/index.js';
import { modeHref } from '../mode.js';
import { plainError } from './errors.js';
import { snippetFromSearch } from './link.js';
import { type CodeEditor, createCodeEditor, runSnippet, runSvsSnippet } from '../runner/index.js';
import { createEmbeddedViewer, type EmbeddedViewer } from '../viewer/index.js';
import './playground.css';

// Playground mode (_spec/README.md decisions 1, 10, outline.md §8): cards for the examples, the snippets of the open
// example, the editor with the suggested edits beside it, errors in plain words below it, and the viewer. A deep link
// (`?mode=playground&snippet=<id>`) opens a snippet; the address follows the open one.

const esc = (text: string) =>
  text.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c] as string);

export async function startPlayground(root: HTMLElement): Promise<void> {
  root.innerHTML = `
    <div class="playground">
      <header class="playground-header">
        <div class="playground-title">
          <h1>Mol* v6 playground</h1>
          <a href="${modeHref('slides')}">Slides</a>
        </div>
        <nav class="cards" aria-label="Examples">
          ${Examples.map(
            (e) =>
              `<button type="button" class="card" data-example="${esc(e.id)}" title="${esc(e.tagline)}"><strong>${esc(e.title)}</strong><span>${esc(e.tagline)}</span></button>`,
          ).join('')}
        </nav>
      </header>
      <main class="playground-body">
        <aside class="guide" aria-label="Suggested edits"></aside>
        <section class="editor-pane">
          <nav class="snippets" aria-label="Snippets"></nav>
          <div class="editor-toolbar">
            <button type="button" class="run">Run</button>
            <span class="hint">Ctrl/Cmd+Enter</span>
            <button type="button" class="reset-all" title="Back to the original code of this snippet">Reset code</button>
          </div>
          <div id="editor"></div>
          <div class="problems" role="status" aria-live="polite" hidden></div>
        </section>
        <div id="viewer"></div>
      </main>
    </div>`;
  const $ = <T extends HTMLElement>(selector: string) => root.querySelector<T>(selector) as T;
  const guide = $<HTMLElement>('.guide');
  const snippetBar = $<HTMLElement>('.snippets');
  const problems = $<HTMLElement>('.problems');
  const cards = [...root.querySelectorAll<HTMLButtonElement>('.card')];

  let current: Snippet = snippetFromSearch(location.search);
  /** The edit whose code is in the editor now (shown as applied); cleared when the person types. */
  let applied: SuggestedEdit | undefined;
  /** The snippet whose scene the viewer shows as a 3D scene (an SVS snippet needs the model it describes). */
  let sceneOf: string | undefined;
  let run = 0;
  /** The latest run, for the console hook below. */
  let last: Promise<void> = Promise.resolve();

  const viewer: EmbeddedViewer = await createEmbeddedViewer($<HTMLElement>('#viewer'));
  const editor: CodeEditor = await createCodeEditor($<HTMLElement>('#editor'), {
    value: current.code,
    kind: current.kind,
    onChange: (value) => {
      if (applied && applied.code !== value) {
        applied = undefined;
        renderGuide();
      }
    },
    onRun: () => void execute(),
  });

  // For checking a scene by hand in the browser's console (the viewer's plugin, the editor); not in a build.
  if (import.meta.env.DEV) Object.assign(window, { __playground: { viewer, editor, idle: () => last } });

  // --- What the page shows around the editor ---------------------------------------------------------------------

  /** Problems below the editor, in plain words; the scene on the right is the last one that worked. */
  function showProblems(lines: readonly string[] | undefined, title = 'Something went wrong.') {
    problems.hidden = !lines?.length;
    if (!lines?.length) return;
    problems.innerHTML = `<strong>${esc(title)}</strong><ul>${lines.map((l) => `<li>${esc(l)}</li>`).join('')}</ul><p>The scene on the right is the last one that worked. Change the code and run it again.</p>`;
  }

  function renderCards() {
    const example = exampleOf(current.id);
    for (const card of cards) card.setAttribute('aria-current', String(card.dataset.example === example?.id));
  }

  function renderSnippets() {
    const example = exampleOf(current.id) as Example;
    snippetBar.innerHTML = example.snippets
      .map(
        (s) =>
          `<button type="button" data-snippet="${esc(s.id)}" aria-current="${s.id === current.id}" title="${esc(s.summary)}">${esc(s.title)}${s.kind === 'svs' ? ' <em>sequence</em>' : ''}</button>`,
      )
      .join('');
  }

  function renderGuide() {
    const edits = editsOf(current.id);
    guide.innerHTML = `
      <h2>${esc(current.title)}</h2>
      <p class="summary">${esc(current.summary)}</p>
      ${
        edits.length
          ? `<h3>Try a change</h3>
      <ol class="edits">${edits
        .map(
          (e, i) => `<li data-edit="${i}"${e === applied ? ' class="applied"' : ''}>
          <strong>${esc(e.title)}</strong>
          <p>${esc(e.hint)}</p>
          <div class="buttons"><button type="button" class="show">Show me</button><button type="button" class="undo"${e === applied ? '' : ' disabled'}>Reset</button></div>
        </li>`,
        )
        .join('')}</ol>`
          : '<p class="none">Edit the code and press Run.</p>'
      }`;
  }

  // --- Running ---------------------------------------------------------------------------------------------------

  function remember() {
    const url = new URL(location.href);
    url.searchParams.set('mode', 'playground');
    url.searchParams.set('snippet', current.id);
    history.replaceState(null, '', url);
  }

  /** Runs the code in the editor: a failed run keeps the last working scene (outline.md §8). */
  function execute(): Promise<void> {
    last = runCode();
    return last;
  }

  async function runCode(): Promise<void> {
    const mine = ++run;
    const code = editor.getValue();
    const fail = (lines: string[], title?: string) => {
      if (mine !== run) return;
      viewer.setStatus(undefined);
      showProblems(lines, title);
    };
    viewer.setStatus('Running…');
    const result = current.kind === 'svs' ? await runSvsSnippet(code) : await runSnippet(code);
    if (mine !== run) return;
    if (!result.ok) {
      const { line, message } = result.error;
      editor.setProblems([result.error]);
      fail([line ? `Line ${line}: ${plainError(message)}` : plainError(message)], 'The code could not be run.');
      return;
    }
    editor.setProblems([]);
    try {
      viewer.setStatus('Loading…');
      if ('svs' in result) {
        // The sequence describes a model: bring the example's 3D scene first when the viewer shows another.
        const base = (exampleOf(current.id) as Example).snippets.find((s) => s.kind === 'mvs');
        if (base && sceneOf !== base.id) {
          const scene = await runSnippet(base.code);
          if (!scene.ok) throw new Error(scene.error.message);
          await viewer.loadMvs(scene.mvs);
          sceneOf = base.id;
          if (mine !== run) return;
        }
        await viewer.loadSvs(result.svs);
      } else {
        await viewer.loadMvs(result.mvs);
        sceneOf = current.id;
      }
    } catch (e) {
      fail([e instanceof Error ? e.message : String(e)], 'The viewer could not show the scene.');
      return;
    }
    if (mine !== run) return;
    viewer.setStatus(undefined);
    showProblems(undefined);
  }

  /** Opens a snippet (original code) in the editor; `go` runs it. */
  async function open(snippet: Snippet, go = true): Promise<void> {
    current = snippet;
    applied = undefined;
    editor.setKind(snippet.kind);
    editor.setValue(snippet.code);
    editor.setProblems([]);
    showProblems(undefined);
    remember();
    renderCards();
    renderSnippets();
    renderGuide();
    if (go) await execute();
  }

  // --- Events ----------------------------------------------------------------------------------------------------

  for (const card of cards) {
    card.onclick = () => {
      const example = Examples.find((e) => e.id === card.dataset.example) as Example;
      void open(example.snippets[0]);
    };
  }
  snippetBar.onclick = (e) => {
    const id = (e.target as HTMLElement).closest<HTMLElement>('[data-snippet]')?.dataset.snippet;
    const snippet = id ? getSnippet(id) : undefined;
    if (snippet) void open(snippet);
  };
  guide.onclick = (e) => {
    const target = e.target as HTMLElement;
    const item = target.closest<HTMLElement>('[data-edit]');
    const edit = item ? editsOf(current.id)[Number(item.dataset.edit)] : undefined;
    if (!edit) return;
    if (target.closest('.show')) {
      applied = edit;
      editor.setValue(edit.code);
      renderGuide();
      void execute();
    } else if (target.closest('.undo')) {
      applied = undefined;
      editor.setValue(current.code);
      renderGuide();
      void execute();
    }
  };
  $<HTMLButtonElement>('.run').onclick = () => void execute();
  $<HTMLButtonElement>('.reset-all').onclick = () => {
    applied = undefined;
    editor.setValue(current.code);
    renderGuide();
    void execute();
  };

  renderCards();
  renderSnippets();
  renderGuide();
  remember();
  await execute();
}
