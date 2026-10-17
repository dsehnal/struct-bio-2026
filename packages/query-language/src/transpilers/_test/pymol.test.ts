/**
 * Copyright (c) 2020-2021 mol* contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Alexander Rose <alexander.rose@weirdbyte.de>
 * @author Panagiotis Tourlas <panagiot_tourlov@hotmail.com>
 * @author Koya Sakuma <koya.sakuma.work@gmail.com>
 */

import { describe, expect, it } from 'vitest';
import * as u from './utils.js';
import { transpiler } from '../pymol/parser.js';
import { keywords } from '../pymol/keywords.js';
import { properties } from '../pymol/properties.js';
import { operators } from '../pymol/operators.js';

const general = {
  supported: [
    // macros
    '10/cb',
    'a/10-12/ca',
    'lig/b/6+8/c+o',

    // trimming
    '    name CA   ',
    'name CA   ',
    '    name CA',

    // a group that starts with a group (an ordered choice used to take the inner group and overflow the stack)
    '((chain A) within 4 of resn STI)',
    'byres ((chain A) within 4 of resn STI)',
    'byres ((chain A and polymer) within 4 of resn STI)',
    'not ((chain A) and resn ALA)',
  ],
  unsupported: [
    // fails to parse, but as a parse error, not a stack overflow
    'bychain ((chain A) within 4 of resn STI)',
    // macros
    'pept/enz/c/3/n',
    'pept/enz///n',

    '/pept/lig/',
    '/pept/lig/a',
    '/pept/lig/a/10',
    '/pept/lig/a/10/ca',
    '/pept//a/10',

    // object
    'foobar',
    'protein and bazbar',
  ],
};

describe('pymol general', () => {
  general.supported.forEach((str) => {
    it(str, () => {
      transpiler(str);
      //          compile(expr);
    });
  });
  general.unsupported.forEach((str) => {
    it(str, () => {
      const transpileStr = () => transpiler(str);
      expect(transpileStr).toThrow();
      expect(transpileStr).not.toThrow(RangeError);
    });
  });
});

// check against builder output
// 'not (resi 42 or chain A)'
// '!resi 42 or chain A'
// 'b >= 0.3',
// 'b != 0.3',
// 'b>0.3',
// 'b <0.3',
// 'b <= 0.3',
// 'b = 1',
// 'fc.=.1',

describe('pymol keywords', () => u.testKeywords(keywords, transpiler));
describe('pymol operators', () => u.testOperators(operators, transpiler));
describe('pymol properties', () => u.testProperties(properties, transpiler));
