/**
 * Copyright (c) 2026 mol* contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author David Sehnal <david.sehnal@gmail.com>
 */

// What a snippet may ask of the page (_spec/README.md decision 3). The sandbox has no network and no Mol*, so a call that
// needs either (`tmAlign`) goes out by postMessage to the page, which answers it. Types only, so the iframe's runtime and
// the page share them without sharing code.

/** A structure file and the chain of it that is meant. */
export interface TmAlignFile {
  /** Where to download it from (http or https). */
  url: string;
  format: 'bcif' | 'mmcif';
  /** The chain id of the file (auth_asym_id). Default: the first polymer chain. */
  chain?: string;
}

export interface TmAlignInput {
  reference: TmAlignFile;
  mobile: TmAlignFile;
}

export interface TmAlignResult {
  /** 4×4, column major: the mobile chain onto the reference (the `matrix` of a `transform` node). */
  matrix: number[];
  /** Normalised by the length of the reference chain; 1 is identical, above 0.5 the same fold. */
  tmScore: number;
  /** Over the aligned residues, in Å. */
  rmsd: number;
  alignedLength: number;
}

/** The page's answers to what a snippet asks. Absent in a run that has no page (an error at the call). */
export interface HostCalls {
  tmAlign(input: TmAlignInput): Promise<TmAlignResult>;
}

/** How long the page may take for one call (a download and the alignment), unlike the snippet's own 5 s. */
export const HOST_TIMEOUT_MS = 60_000;

/** A promise that fails with `message` when `ms` pass first. */
export function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const late = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(message)), ms);
  });
  return Promise.race([promise, late]).finally(() => clearTimeout(timer));
}
