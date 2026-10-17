/**
 * Copyright (c) 2026 mol* contributors, licensed under MIT, See LICENSE file for more info.
 *
 * Developed in collaboration with Anyfold <https://anyfold.ai/>
 *
 * @author David Sehnal <david.sehnal@gmail.com>
 */

import * as monaco from 'monaco-editor';
import EditorWorker from 'monaco-editor/editor/editor.worker?worker';
import TsWorker from 'monaco-editor/language/typescript/ts.worker?worker';
import { MVS_TYPES } from './generated/mvs-types.js';
import { SVS_TYPES } from './generated/svs-types.js';
import type { SnippetKind } from './runtime/core.js';
import type { CodeProblem } from './transpile.js';

// Monaco for snippets (_spec/README.md decision 3): the builder's typings (MVS's or SeqViewSpec's, by the snippet's kind) as an extra library, TypeScript strict, and the
// run's problems as markers. Imported lazily by `createCodeEditor` (index.ts): Monaco is large, and the slides do not
// need it. Its TypeScript service runs in a worker (the `?worker` imports are Vite's).

const scope = globalThis as { MonacoEnvironment?: monaco.Environment };
scope.MonacoEnvironment ??= {
  getWorker: (_id: string, label: string) =>
    label === 'typescript' || label === 'javascript' ? new TsWorker() : new EditorWorker(),
};

export type EditorTheme = 'light' | 'dark';

const THEMES: Record<EditorTheme, string> = { light: 'vs', dark: 'vs-dark' };

/** `ts.ModuleDetectionKind.Force`: every file is a module, so two models with the same `const` do not clash. */
const MODULE_DETECTION_FORCE = 3;

let configured = false;
let current: SnippetKind | undefined;

const TYPINGS: Record<SnippetKind, string> = { mvs: MVS_TYPES, svs: SVS_TYPES };

/** The typings of a kind as the only extra library: one language service serves every model, so the kind is global. */
function useKind(kind: SnippetKind): void {
  if (current === kind) return;
  current = kind;
  // Set whole (not added by handle): nothing from an earlier configuration stays behind.
  monaco.typescript.typescriptDefaults.setExtraLibs([{ content: TYPINGS[kind], filePath: `ts:${kind}.d.ts` }]);
}

function configure(): void {
  if (configured) return;
  configured = true;
  const ts = monaco.typescript;
  ts.typescriptDefaults.setEagerModelSync(true);
  ts.typescriptDefaults.setCompilerOptions({
    target: ts.ScriptTarget.ES2020,
    module: ts.ModuleKind.ESNext,
    moduleDetection: MODULE_DETECTION_FORCE,
    strict: true,
    allowNonTsExtensions: true,
    lib: ['es2020'],
  });
}

/**
 * Monaco's TypeScript worker, once its language has started: the first model of the language starts it a moment later,
 * and asking before then fails ("TypeScript not registered!").
 */
async function typeScriptWorker(): ReturnType<typeof monaco.typescript.getTypeScriptWorker> {
  for (let tries = 0; ; tries++) {
    try {
      return await monaco.typescript.getTypeScriptWorker();
    } catch (e) {
      if (tries >= 40 || !/not registered/i.test(String(e))) throw e;
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
  }
}

async function modelTypeErrors(model: monaco.editor.ITextModel): Promise<CodeProblem[]> {
  const worker = await (await typeScriptWorker())(model.uri);
  const uri = model.uri.toString();
  const found = [...(await worker.getSyntacticDiagnostics(uri)), ...(await worker.getSemanticDiagnostics(uri))];
  return found.map((d) => ({
    line: d.start !== undefined ? model.getPositionAt(d.start).lineNumber : 0,
    message: typeof d.messageText === 'string' ? d.messageText : d.messageText.messageText,
  }));
}

let checks = 0;

/**
 * Type errors in a snippet, with the builder's typings around it: Monaco's TypeScript worker on a model of its own (no
 * editor needed). Messages are TypeScript's.
 */
export async function typeErrors(code: string, kind: SnippetKind = 'mvs'): Promise<CodeProblem[]> {
  configure();
  useKind(kind);
  const model = monaco.editor.createModel(
    code,
    'typescript',
    monaco.Uri.parse(`inmemory://snippet/check-${++checks}.ts`),
  );
  try {
    return await modelTypeErrors(model);
  } finally {
    model.dispose();
  }
}

export interface CodeEditorOptions {
  value: string;
  onChange?: (value: string) => void;
  /** Ctrl/Cmd+Enter (and Ctrl/Cmd+S): run the snippet. */
  onRun?: () => void;
  theme?: EditorTheme;
  readOnly?: boolean;
  /** Which builder's typings the code gets (default `mvs`); `setKind` changes it. */
  kind?: SnippetKind;
}

export interface CodeEditor {
  getValue(): string;
  /** Replaces the code (the change event fires only when it differs). */
  setValue(value: string): void;
  setTheme(theme: EditorTheme): void;
  /** Switches the typings (the builder the code is written against). The editor shows one kind at a time. */
  setKind(kind: SnippetKind): void;
  /** Shows problems from a run (syntax, run time, validation) as markers; lines of 0 or none are not shown. */
  setProblems(problems: readonly { message: string; line?: number }[]): void;
  /** TypeScript's errors for the code now in the editor, through Monaco's worker. */
  typeErrors(): Promise<CodeProblem[]>;
  focus(): void;
  dispose(): void;
}

export function createEditor(el: HTMLElement, options: CodeEditorOptions): CodeEditor {
  configure();
  useKind(options.kind ?? 'mvs');
  const editor = monaco.editor.create(el, {
    theme: THEMES[options.theme ?? 'light'],
    readOnly: options.readOnly ?? false,
    model: monaco.editor.createModel(
      options.value,
      'typescript',
      monaco.Uri.parse(`inmemory://snippet/editor-${++checks}.ts`),
    ),
    fixedOverflowWidgets: true,
    fontSize: 13,
    lineHeight: 20,
    minimap: { enabled: false },
    scrollBeyondLastLine: false,
    automaticLayout: true,
    renderLineHighlight: 'none',
    overviewRulerLanes: 0,
    folding: false,
    lineNumbersMinChars: 3,
    padding: { top: 10, bottom: 10 },
    scrollbar: { verticalScrollbarSize: 8, horizontalScrollbarSize: 8, useShadows: false },
    tabSize: 2,
    wordWrap: 'on',
    links: false,
    wrappingIndent: 'indent',
  });
  const model = editor.getModel() as monaco.editor.ITextModel;
  const run = () => options.onRun?.();
  editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, run);
  editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, run);
  const subscription = editor.onDidChangeModelContent(() => options.onChange?.(editor.getValue()));
  return {
    getValue: () => editor.getValue(),
    setValue: (value) => {
      if (editor.getValue() !== value) editor.setValue(value);
    },
    setTheme: (theme) => monaco.editor.setTheme(THEMES[theme]),
    setKind: useKind,
    setProblems: (problems) =>
      monaco.editor.setModelMarkers(
        model,
        'runner',
        problems
          .filter((p) => (p.line ?? 0) > 0)
          .map((p) => {
            const line = Math.min(p.line as number, model.getLineCount());
            return {
              severity: monaco.MarkerSeverity.Error,
              message: p.message,
              startLineNumber: line,
              startColumn: 1,
              endLineNumber: line,
              endColumn: model.getLineMaxColumn(line),
            };
          }),
      ),
    typeErrors: () => modelTypeErrors(model),
    focus: () => editor.focus(),
    dispose: () => {
      subscription.dispose();
      editor.dispose();
      model.dispose();
    },
  };
}
