/**
 * Copyright (c) 2026 mol* contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author David Sehnal <david.sehnal@gmail.com>
 */

import { SortedArray } from '@molstar/core/data/int/sorted-array';
import { OrderedSet } from '@molstar/core/data/int/ordered-set';
import { CIF } from '@molstar/io/reader/cif';
import { trajectoryFromMmCIF } from '@molstar/model/formats/structure/mmcif';
import { Structure, StructureElement, Unit } from '@molstar/model/model/structure';
import { tmAlign } from '@molstar/model/model/structure/structure/util/tm-align';
import type { TmAlignFile, TmAlignInput, TmAlignResult } from './host.js';

// `tmAlign` of a snippet, done by the page (host.ts): the files are downloaded and read here, the chain's trace atoms are
// the polymer elements of its unit (one Cα per residue), and Mol*'s TM-align puts the mobile chain onto the reference
// (the same call as Prism's `superpose.tm-align`, features/superposition/operations.ts).

/** What a file is as the page reads it: text for mmCIF, bytes for BinaryCIF. */
export type FileLoader = (url: string, format: TmAlignFile['format']) => Promise<string | Uint8Array>;

/** Too few residues give no fold to compare (TM-align's own scores are meaningless below this). */
const MIN_RESIDUES = 5;

/** A structure's polymer chains by their chain id (auth_asym_id): the trace elements of each, as a locus. */
function polymerChains(structure: Structure): Map<string, StructureElement.Loci> {
  const out = new Map<string, StructureElement.Loci>();
  for (const unit of structure.units) {
    if (!Unit.isAtomic(unit) || unit.polymerElements.length === 0) continue;
    const h = unit.model.atomicHierarchy;
    const chain = h.chains.auth_asym_id.value(unit.chainIndex[unit.elements[0]]);
    // One copy of a chain id: the first (a chain id may repeat for another unit, such as a ligand's).
    if (out.has(chain)) continue;
    const indices = SortedArray.indicesOf(unit.elements, unit.polymerElements);
    out.set(chain, StructureElement.Loci(structure, [{ unit, indices: indices as OrderedSet<never> }]));
  }
  return out;
}

async function structureOf(file: TmAlignFile, data: string | Uint8Array): Promise<Structure> {
  const parsed = await CIF.parse(data).run();
  if (parsed.isError) throw new Error(`${file.url} is not a ${file.format} file Mol* can read (${parsed.message}).`);
  const block = parsed.result.blocks[0];
  if (!block) throw new Error(`${file.url} holds no data.`);
  const trajectory = await trajectoryFromMmCIF(block, parsed.result).run();
  return Structure.ofModel(trajectory.representative);
}

/** The trace of the chain a file names, or why it cannot be had. */
async function traceOf(file: TmAlignFile, data: string | Uint8Array): Promise<StructureElement.Loci> {
  const chains = polymerChains(await structureOf(file, data));
  if (chains.size === 0) throw new Error(`${file.url} has no polymer chain.`);
  const chain = file.chain ?? [...chains.keys()][0];
  const loci = chains.get(chain);
  if (!loci) {
    throw new Error(
      `${file.url} has no polymer chain "${chain}" (its polymer chains: ${[...chains.keys()].join(', ')}).`,
    );
  }
  const n = StructureElement.Loci.size(loci);
  if (n < MIN_RESIDUES) {
    throw new Error(
      `Chain ${chain} of ${file.url} has ${n} residue${n === 1 ? '' : 's'}: too few to align (at least ${MIN_RESIDUES}).`,
    );
  }
  return loci;
}

/** TM-align of the chains the two files name, the mobile one onto the reference. */
export async function alignFiles(
  reference: TmAlignFile,
  referenceData: string | Uint8Array,
  mobile: TmAlignFile,
  mobileData: string | Uint8Array,
): Promise<TmAlignResult> {
  const a = await traceOf(reference, referenceData);
  const b = await traceOf(mobile, mobileData);
  const r = tmAlign(a, b);
  if (r.alignedLength === 0 || Number.isNaN(r.rmsd)) {
    throw new Error('TM-align found nothing in common between the two chains.');
  }
  return { matrix: Array.from(r.bTransform), tmScore: r.tmScoreA, rmsd: r.rmsd, alignedLength: r.alignedLength };
}

/** A page-side `tmAlign`: downloads through `load`, and remembers the files and the answers (a re-run asks nothing). */
export function createTmAlign(load: FileLoader): (input: TmAlignInput) => Promise<TmAlignResult> {
  const files = new Map<string, Promise<string | Uint8Array>>();
  const answers = new Map<string, Promise<TmAlignResult>>();
  const file = (f: TmAlignFile) => {
    const key = `${f.format} ${f.url}`;
    let loaded = files.get(key);
    if (!loaded) {
      loaded = load(f.url, f.format);
      files.set(key, loaded);
      loaded.catch(() => files.delete(key));
    }
    return loaded;
  };
  return (input) => {
    const key = JSON.stringify([input.reference, input.mobile]);
    let answer = answers.get(key);
    if (!answer) {
      answer = Promise.all([file(input.reference), file(input.mobile)]).then(([a, b]) =>
        alignFiles(input.reference, a, input.mobile, b),
      );
      answers.set(key, answer);
      answer.catch(() => answers.delete(key));
    }
    return answer;
  };
}

/** The page's loader: `fetch`, over http or https only. */
export const fetchFile: FileLoader = async (url, format) => {
  let address: URL;
  try {
    address = new URL(url);
  } catch {
    throw new Error(`"${url}" is not an address.`);
  }
  if (address.protocol !== 'https:' && address.protocol !== 'http:')
    throw new Error(`"${url}" is not an http or https address.`);
  let response: Response;
  try {
    response = await fetch(address);
  } catch {
    throw new Error(`Could not download ${url} (is it reachable, and does it allow other pages to read it?).`);
  }
  if (!response.ok) throw new Error(`Could not download ${url} (HTTP ${response.status}).`);
  return format === 'bcif' ? new Uint8Array(await response.arrayBuffer()) : await response.text();
};

export const pageTmAlign = createTmAlign(fetchFile);
