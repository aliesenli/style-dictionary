/*
 * Copyright 2017 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance with
 * the License. A copy of the License is located at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * or in the "license" file accompanying this file. This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR
 * CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions
 * and limitations under the License.
 */

import defaults from './defaults';

import type { RegexOptions } from '../../types/Config';

/**
 * @typedef {import('../../../types/Config.d.ts').RegexOptions} RegexOptions
 * @param {RegexOptions} opts
 * @returns {RegExp}
 */
export default function createReferenceRegex(opts: RegexOptions = {}) {
  const options = { ...defaults, ...opts };

  return new RegExp(
    '\\' +
      options.opening_character +
      '([^' +
      options.closing_character +
      ']+)' +
      '\\' +
      options.closing_character,
    'g',
  );
}