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

import type { RegexOptions } from '../../types/Config';
import defaults from './defaults';

/**
 * Returns the paths name be joining its parts with a given separator.
 *
 * @private
 * @param {string[]} path
 * @param {RegexOptions} [opts]
 * @returns {string} - The paths name
 */
export default function getName(path: string[], opts: RegexOptions = {}) {
  const options = { ...defaults, ...opts };
  if (!Array.isArray(path)) {
    throw new Error('Getting name for path failed. Token path must be an array of strings');
  }
  return path.join(options.separator);
}