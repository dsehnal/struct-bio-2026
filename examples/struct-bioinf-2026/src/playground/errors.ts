/**
 * Copyright (c) 2026 mol* contributors, licensed under MIT, See LICENSE file for more info.
 *
 * Developed in collaboration with Anyfold <https://anyfold.ai/>
 *
 * @author David Sehnal <david.sehnal@gmail.com>
 */

/**
 * An error of the code in plain words, for a participant who does not write code. The common mistakes (a misspelled name,
 * a step that does not exist) get a sentence; the original message follows it, for anyone who wants it.
 */
export function plainError(message: string): string {
  const missing = /^ReferenceError: (\w+) is not defined/.exec(message);
  if (missing) return `"${missing[1]}" is not a name that is known here. Check the spelling. (${message})`;
  const step = /\.(\w+) is not a function/.exec(message);
  if (step) {
    return `"${step[1]}" is not a step that exists at this point of the description. Check its spelling and the order of the steps. (${message})`;
  }
  return message;
}
