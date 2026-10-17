/**
 * Copyright (c) 2026 mol* contributors, licensed under MIT, See LICENSE file for more info.
 *
 * Developed in collaboration with Anyfold <https://anyfold.ai/>
 *
 * @author David Sehnal <david.sehnal@gmail.com>
 */

import { modeHref } from '../mode.js';
import { createCodeEditor, runSnippet } from '../runner/index.js';
import { createEmbeddedViewer } from '../viewer/index.js';
import './playground.css';

// Playground mode (_spec/README.md decisions 1, 10): a header with the example cards, the editor on the left, the viewer
// on the right. Only the layout so far: `#editor` is filled by the editor module, the cards by the examples.

/** The example cards (outline.md §8): placeholders until the snippets are files. */
const Cards: readonly { readonly title: string; readonly text: string }[] = [
  { title: 'Smallest scene', text: 'Download, parse, cartoon.' },
  { title: 'A: p53', text: 'From sequence to variant.' },
  { title: 'B: imatinib', text: 'A drug and its evidence.' },
  { title: 'C: spike', text: 'A light story.' },
];

export async function startPlayground(root: HTMLElement): Promise<void> {
  root.innerHTML = `
    <div class="playground">
      <header class="playground-header">
        <div class="playground-title">
          <h1>Mol* v6 playground</h1>
          <a href="${modeHref('slides')}">Slides</a>
        </div>
        <div class="cards">
          ${Cards.map(
            (c) =>
              `<button type="button" class="card" disabled><strong>${c.title}</strong><span>${c.text}</span></button>`,
          ).join('')}
        </div>
      </header>
      <main class="playground-body">
        <div class="editor-pane">
          <div class="editor-toolbar"><button type="button" class="run">Run</button><span>Ctrl/Cmd+Enter</span></div>
          <div id="editor"></div>
        </div>
        <div id="viewer"></div>
      </main>
    </div>`;
  const viewer = await createEmbeddedViewer(root.querySelector<HTMLElement>('#viewer')!);
  const editor = await createCodeEditor(root.querySelector<HTMLElement>('#editor')!, {
    value: StartSnippet,
    onRun: () => void run(),
  });
  root.querySelector<HTMLButtonElement>('.run')!.onclick = () => void run();

  // A failed run keeps the last working scene on screen (outline.md §8) and shows the error at its line.
  async function run() {
    const result = await runSnippet(editor.getValue());
    if (!result.ok) {
      editor.setProblems([result.error]);
      viewer.setStatus(
        result.error.line ? `Line ${result.error.line}: ${result.error.message}` : result.error.message,
        'error',
      );
      return;
    }
    editor.setProblems([]);
    viewer.setStatus(undefined);
    try {
      await viewer.loadMvs(result.mvs);
    } catch (e) {
      viewer.setStatus(e instanceof Error ? e.message : String(e), 'error');
    }
  }
  await run();
}

/** The smallest scene, until the examples are files (README decision 2). */
const StartSnippet = `const s = builder
  .download({ url: 'https://www.ebi.ac.uk/pdbe/entry-files/download/1cbs.bcif' })
  .parse({ format: 'bcif' })
  .modelStructure();
s.component({ selector: 'polymer' }).representation({ type: 'cartoon' }).color({ color: 'teal' });
s.component({ selector: molql('resn REA') }).representation({ type: 'ball_and_stick' });
`;
