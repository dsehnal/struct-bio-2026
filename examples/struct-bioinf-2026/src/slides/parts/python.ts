/**
 * Copyright (c) 2026 mol* contributors, licensed under MIT, See LICENSE file for more info.
 *
 * Developed in collaboration with Anyfold <https://anyfold.ai/>
 *
 * @author David Sehnal <david.sehnal@gmail.com>
 */

import { getSnippet } from '../../examples/index.js';
import { highlight } from '../highlight.js';
import { link, notes, slide } from '../html.js';
import { Links } from '../links.js';

// "Python or TypeScript" (outline.md §3, principle 5): the same smallest scene in both, at the end of the talk, before the
// playground: the notebook is a way to write descriptions.

const PythonCode = `from molviewspec import create_builder

url = "https://www.ebi.ac.uk/pdbe/entry-files/download/1cbs.bcif"
builder = create_builder()
(
    builder.download(url=url)
    .parse(format="bcif")
    .model_structure()
    .component(selector="polymer")
    .representation(type="cartoon")
    .color(color="teal")
)
state = builder.get_state()  # the same tree`;

const FallbackTypeScript = `builder
  .download({ url: 'https://www.ebi.ac.uk/pdbe/entry-files/download/1cbs.bcif' })
  .parse({ format: 'bcif' })
  .modelStructure()
  .component({ selector: 'polymer' })
  .representation({ type: 'cartoon' })
  .color({ color: 'teal' });`;

/** The slide: the TypeScript of the first snippet beside the Python of the same scene, with the Colab link. */
export function pythonSlide(part: number): string {
  // The TypeScript side is the first snippet of the deck, without its comment line.
  const typescript = (getSnippet('basics-smallest')?.code ?? FallbackTypeScript)
    .split('\n')
    .filter((line) => !line.startsWith('//'))
    .join('\n')
    .trim();
  return slide({
    part,
    notes: notes(
      'Python or TypeScript. The description you have seen all hour can also be <strong>written</strong> in Python, with the <code>molviewspec</code> package. The same builder, the same steps and names; Python uses snake_case. The code on the slide is the smallest scene, on both sides.',
      'That is the way to build a scene from your own analysis: in a notebook, loop over a table of scores from your pipeline, and the description comes out with your data in it. The Colab notebook is the default starting point (the link is on the slide and in the chat).',
      'The talk and the playground use TypeScript, because it runs in the browser with nothing to set up, and the editor completes and checks it as you type.',
      'SeqViewSpec has no Python builder yet; it may get one later.',
    ),
    foot: `<a class="chip" href="${Links.colab}" target="_blank" rel="noopener">Open the Colab notebook</a>`,
    body: `
      <header class="slide-head">
        <h2>Write it in Python or TypeScript</h2>
        <p class="lead">The same builder in both. In a notebook, build a scene from your own analysis: ${link(Links.colab, 'default Colab notebook')}.</p>
      </header>
      <div class="code-pair">
        <div class="stack"><span class="code-label">TYPESCRIPT · molviewspec builder, the playground</span><pre class="code"><code>${highlight(typescript, 'ts')}</code></pre></div>
        <div class="stack"><span class="code-label">PYTHON · molviewspec, a notebook</span><pre class="code"><code>${highlight(PythonCode, 'py')}</code></pre></div>
      </div>`,
  });
}
