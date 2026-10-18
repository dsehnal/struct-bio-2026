/**
 * Copyright (c) 2026 mol* contributors, licensed under MIT, See LICENSE file for more info.
 *
 * Developed in collaboration with Anyfold <https://anyfold.ai/>
 *
 * @author David Sehnal <david.sehnal@gmail.com>
 */

// A QR code as an SVG, with no dependency: byte mode, error correction level M, versions 1–10 (up to 213 bytes), after the
// QR Code specification (ISO/IEC 18004) in the structure of Nayuki's public-domain generator. The deck uses it for the
// playground's address (outline.md §0, §7), so a participant can open it from the screen.

/** Error correction codewords per block and number of blocks, level M, by version (index 0 unused). */
const EccPerBlock = [0, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26];
const NumBlocks = [0, 1, 1, 1, 2, 2, 4, 4, 4, 5, 5];
const MaxVersion = 10;
/** The format bits' code of level M. */
const LevelBitsM = 0;

const bit = (value: number, i: number) => ((value >>> i) & 1) !== 0;

function rawDataModules(version: number): number {
  let result = (16 * version + 128) * version + 64;
  if (version >= 2) {
    const align = Math.floor(version / 7) + 2;
    result -= (25 * align - 10) * align - 55;
    if (version >= 7) result -= 36;
  }
  return result;
}

const dataCodewords = (version: number) =>
  Math.floor(rawDataModules(version) / 8) - EccPerBlock[version] * NumBlocks[version];

function alignmentPositions(version: number): number[] {
  if (version === 1) return [];
  const count = Math.floor(version / 7) + 2;
  const step = Math.ceil((version * 4 + 4) / (count * 2 - 2)) * 2;
  const result = [6];
  for (let pos = version * 4 + 10; result.length < count; pos -= step) result.splice(1, 0, pos);
  return result;
}

// --- Reed-Solomon over GF(256) with the polynomial 0x11D ---------------------------------------------------------------

function gfMultiply(x: number, y: number): number {
  let z = 0;
  for (let i = 7; i >= 0; i--) {
    z = (z << 1) ^ ((z >>> 7) * 0x11d);
    z ^= ((y >>> i) & 1) * x;
  }
  return z;
}

function divisor(degree: number): number[] {
  const result = new Array<number>(degree).fill(0);
  result[degree - 1] = 1;
  let root = 1;
  for (let i = 0; i < degree; i++) {
    for (let j = 0; j < degree; j++) {
      result[j] = gfMultiply(result[j], root);
      if (j + 1 < degree) result[j] ^= result[j + 1];
    }
    root = gfMultiply(root, 2);
  }
  return result;
}

function remainder(data: readonly number[], div: readonly number[]): number[] {
  const result = new Array<number>(div.length).fill(0);
  for (const b of data) {
    const factor = b ^ (result.shift() as number);
    result.push(0);
    div.forEach((coef, i) => {
      result[i] ^= gfMultiply(coef, factor);
    });
  }
  return result;
}

// --- the symbol --------------------------------------------------------------------------------------------------------

function codewordsOf(bytes: readonly number[], version: number): number[] {
  const capacity = dataCodewords(version);
  const bits: number[] = [];
  const put = (value: number, length: number) => {
    for (let i = length - 1; i >= 0; i--) bits.push((value >>> i) & 1);
  };
  put(0b0100, 4);
  put(bytes.length, version < 10 ? 8 : 16);
  for (const b of bytes) put(b, 8);
  put(0, Math.min(4, capacity * 8 - bits.length));
  put(0, (8 - (bits.length % 8)) % 8);
  const data: number[] = [];
  for (let i = 0; i < bits.length; i += 8) data.push(parseInt(bits.slice(i, i + 8).join(''), 2));
  for (let pad = 0xec; data.length < capacity; pad ^= 0xec ^ 0x11) data.push(pad);

  // Blocks with their error correction, interleaved.
  const blocks = NumBlocks[version];
  const eccLen = EccPerBlock[version];
  const raw = Math.floor(rawDataModules(version) / 8);
  const shortBlocks = blocks - (raw % blocks);
  const shortLen = Math.floor(raw / blocks);
  const div = divisor(eccLen);
  const split: number[][] = [];
  for (let i = 0, k = 0; i < blocks; i++) {
    const dat = data.slice(k, k + shortLen - eccLen + (i < shortBlocks ? 0 : 1));
    k += dat.length;
    split.push([...dat, ...(i < shortBlocks ? [0] : []), ...remainder(dat, div)]);
  }
  const out: number[] = [];
  for (let i = 0; i < split[0].length; i++) {
    split.forEach((block, j) => {
      // The padding slot of a short block is skipped.
      if (i !== shortLen - eccLen || j >= shortBlocks) out.push(block[i]);
    });
  }
  return out;
}

class QrSymbol {
  readonly size: number;
  readonly modules: boolean[][];
  readonly isFunction: boolean[][];

  constructor(
    readonly version: number,
    codewords: readonly number[],
  ) {
    this.size = version * 4 + 17;
    const grid = () => Array.from({ length: this.size }, () => new Array<boolean>(this.size).fill(false));
    this.modules = grid();
    this.isFunction = grid();
    this.drawFunctionPatterns();
    this.drawCodewords(codewords);
    // The mask with the lowest penalty.
    let best = 0;
    let bestPenalty = Infinity;
    for (let mask = 0; mask < 8; mask++) {
      this.applyMask(mask);
      this.drawFormat(mask);
      const penalty = this.penalty();
      if (penalty < bestPenalty) {
        best = mask;
        bestPenalty = penalty;
      }
      this.applyMask(mask);
    }
    this.applyMask(best);
    this.drawFormat(best);
  }

  private set(x: number, y: number, dark: boolean) {
    this.modules[y][x] = dark;
    this.isFunction[y][x] = true;
  }

  private drawFunctionPatterns() {
    const { size, version } = this;
    for (let i = 0; i < size; i++) {
      this.set(6, i, i % 2 === 0);
      this.set(i, 6, i % 2 === 0);
    }
    for (const [x, y] of [
      [3, 3],
      [size - 4, 3],
      [3, size - 4],
    ]) {
      for (let dy = -4; dy <= 4; dy++) {
        for (let dx = -4; dx <= 4; dx++) {
          const dist = Math.max(Math.abs(dx), Math.abs(dy));
          const xx = x + dx;
          const yy = y + dy;
          if (xx >= 0 && xx < size && yy >= 0 && yy < size) this.set(xx, yy, dist !== 2 && dist !== 4);
        }
      }
    }
    const pos = alignmentPositions(version);
    pos.forEach((x, i) => {
      pos.forEach((y, j) => {
        if ((i === 0 && j === 0) || (i === 0 && j === pos.length - 1) || (i === pos.length - 1 && j === 0)) return;
        for (let dy = -2; dy <= 2; dy++) {
          for (let dx = -2; dx <= 2; dx++) this.set(x + dx, y + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
        }
      });
    });
    this.drawFormat(0);
    if (version >= 7) {
      let rem = version;
      for (let i = 0; i < 12; i++) rem = (rem << 1) ^ ((rem >>> 11) * 0x1f25);
      const bits = (version << 12) | rem;
      for (let i = 0; i < 18; i++) {
        const a = size - 11 + (i % 3);
        const b = Math.floor(i / 3);
        this.set(a, b, bit(bits, i));
        this.set(b, a, bit(bits, i));
      }
    }
  }

  private drawFormat(mask: number) {
    const { size } = this;
    const data = (LevelBitsM << 3) | mask;
    let rem = data;
    for (let i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
    const bits = ((data << 10) | rem) ^ 0x5412;
    for (let i = 0; i <= 5; i++) this.set(8, i, bit(bits, i));
    this.set(8, 7, bit(bits, 6));
    this.set(8, 8, bit(bits, 7));
    this.set(7, 8, bit(bits, 8));
    for (let i = 9; i < 15; i++) this.set(14 - i, 8, bit(bits, i));
    for (let i = 0; i < 8; i++) this.set(size - 1 - i, 8, bit(bits, i));
    for (let i = 8; i < 15; i++) this.set(8, size - 15 + i, bit(bits, i));
    this.set(8, size - 8, true);
  }

  private drawCodewords(codewords: readonly number[]) {
    const { size } = this;
    let i = 0;
    for (let right = size - 1; right >= 1; right -= 2) {
      if (right === 6) right = 5;
      for (let vert = 0; vert < size; vert++) {
        for (let j = 0; j < 2; j++) {
          const x = right - j;
          const upward = ((right + 1) & 2) === 0;
          const y = upward ? size - 1 - vert : vert;
          if (!this.isFunction[y][x] && i < codewords.length * 8) {
            this.modules[y][x] = bit(codewords[i >>> 3], 7 - (i & 7));
            i++;
          }
        }
      }
    }
  }

  private applyMask(mask: number) {
    for (let y = 0; y < this.size; y++) {
      for (let x = 0; x < this.size; x++) {
        let invert: boolean;
        switch (mask) {
          case 0:
            invert = (x + y) % 2 === 0;
            break;
          case 1:
            invert = y % 2 === 0;
            break;
          case 2:
            invert = x % 3 === 0;
            break;
          case 3:
            invert = (x + y) % 3 === 0;
            break;
          case 4:
            invert = (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0;
            break;
          case 5:
            invert = ((x * y) % 2) + ((x * y) % 3) === 0;
            break;
          case 6:
            invert = (((x * y) % 2) + ((x * y) % 3)) % 2 === 0;
            break;
          default:
            invert = (((x + y) % 2) + ((x * y) % 3)) % 2 === 0;
        }
        if (!this.isFunction[y][x] && invert) this.modules[y][x] = !this.modules[y][x];
      }
    }
  }

  /** The specification's four penalty rules: runs, 2x2 blocks, finder-like patterns, balance. */
  private penalty(): number {
    const { size, modules } = this;
    let result = 0;
    const lines: string[] = [];
    for (let y = 0; y < size; y++) lines.push(modules[y].map((d) => (d ? '1' : '0')).join(''));
    for (let x = 0; x < size; x++) lines.push(modules.map((row) => (row[x] ? '1' : '0')).join(''));
    for (const line of lines) {
      for (const m of line.matchAll(/(0{5,}|1{5,})/g)) result += 3 + (m[0].length - 5);
      for (const pattern of ['10111010000', '00001011101']) {
        for (let i = line.indexOf(pattern); i >= 0; i = line.indexOf(pattern, i + 1)) result += 40;
      }
    }
    for (let y = 0; y < size - 1; y++) {
      for (let x = 0; x < size - 1; x++) {
        const c = modules[y][x];
        if (c === modules[y][x + 1] && c === modules[y + 1][x] && c === modules[y + 1][x + 1]) result += 3;
      }
    }
    const dark = modules.reduce((n, row) => n + row.filter(Boolean).length, 0);
    const total = size * size;
    result += (Math.ceil(Math.abs(dark * 20 - total * 10) / total) - 1) * 10;
    return result;
  }
}

/** The modules of the QR code of `text` (`true`: dark), `size` × `size`; throws when the text is too long (213 bytes). */
export function qrModules(text: string): boolean[][] {
  const bytes = [...new TextEncoder().encode(text)];
  for (let version = 1; version <= MaxVersion; version++) {
    const bits = 4 + (version < 10 ? 8 : 16) + bytes.length * 8;
    if (bits <= dataCodewords(version) * 8) return new QrSymbol(version, codewordsOf(bytes, version)).modules;
  }
  throw new Error(`The text is too long for the QR encoder (${bytes.length} bytes, at most 213).`);
}

/** The QR code of `text` as an SVG with a quiet zone of four modules, dark on white. */
export function qrSvg(text: string, label = 'QR code'): string {
  const modules = qrModules(text);
  const n = modules.length;
  const quiet = 4;
  const path: string[] = [];
  modules.forEach((row, y) => {
    for (let x = 0; x < n; ) {
      if (!row[x]) {
        x++;
        continue;
      }
      let end = x;
      while (end < n && row[end]) end++;
      path.push(`M${x + quiet} ${y + quiet}h${end - x}v1h-${end - x}z`);
      x = end;
    }
  });
  const total = n + 2 * quiet;
  return `<svg class="qr" viewBox="0 0 ${total} ${total}" shape-rendering="crispEdges" role="img" aria-label="${label}"><rect width="${total}" height="${total}" fill="#fff"/><path d="${path.join('')}" fill="#111827"/></svg>`;
}
