/**
 * Copyright (c) 2026 mol* contributors, licensed under MIT, See LICENSE file for more info.
 *
 * Developed in collaboration with Anyfold <https://anyfold.ai/>
 *
 * @author David Sehnal <david.sehnal@gmail.com>
 */

import { assistant } from '@molstar/prism-assistant/spec';
import { createEmbeddedViewerWith, type EmbeddedViewer, embeddedViewerSpec } from './index.js';

// The viewer of the assistant slide (outline.md §7): the embedded viewer with its full UI and the assistant. This module is
// imported dynamically by that one slide, so the playground and the other slides never load it; the assistant itself is
// loaded by Prism on first use (`assistant()` is a lazy loader: viewer-spec.md §2.4), here at the start because the
// Assistant tab is open (`ui.layout.start`), where the presenter enters a key. No key is ever in the page: the person's
// keys are kept by the assistant (prism-assistant _spec §Contracts), memory only unless the presenter chooses more.

export async function createAssistantViewer(container: HTMLElement): Promise<EmbeddedViewer> {
  const base = embeddedViewerSpec('full');
  return createEmbeddedViewerWith(container, {
    ...base,
    ui: { ...base.ui, layout: { ...base.ui?.layout, start: 'assistant.tab.assistant' } },
    agent: { ...(base.agent || {}), assistant: assistant() },
  });
}
