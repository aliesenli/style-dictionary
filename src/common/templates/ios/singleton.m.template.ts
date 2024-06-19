import type { Config, LocalOptions, TransformedToken, TransformedTokens } from '../../../types';
import type { InternalFnArguments } from '../../../types/Format';

/**
 *
 * @param {TransformedTokens} slice
 * @param {Config & LocalOptions} options
 * @param {string} [indent]
 */
function buildDictionary(
  slice: TransformedTokens,
  options: LocalOptions & Config,
  indent?: string,
) {
  indent = indent || '  ';
  let to_ret = '@{\n';
  if (Object.hasOwn(slice, `${options.usesDtcg ? '$' : ''}value`)) {
    const token = slice as TransformedToken;
    let value = options.usesDtcg ? token.$value : token.value;
    const type = options.usesDtcg ? token.$type : token.type;
    if (type === 'dimension' || type === 'fontSize' || type === 'time') {
      value = '@' + value;
    }
    to_ret += indent + '@"value": ' + value + ',\n';
    to_ret += indent + '@"name": @"' + token.name + '",\n';

    for (const name in token.attributes) {
      if (token.attributes[name]) {
        to_ret += indent + '@"' + name + '": @"' + token.attributes[name] + '",\n';
      }
    }

    // remove last comma
    return to_ret.slice(0, -2) + '\n' + indent + '}';
  } else {
    for (const name in slice) {
      to_ret +=
        indent + '@"' + name + '": ' + buildDictionary(slice[name], options, indent + '  ') + ',\n';
    }
    // remove last comma
    return to_ret.slice(0, -2) + '\n' + indent + '}';
  }
}

/**
 * @param {{
 *   dictionary: Dictionary
 *   options: Config & LocalOptions
 *   file: File
 *   header: string
 * }} opts
 */
export default ({ dictionary, options, file, header }: Omit<InternalFnArguments, 'platform'>) => `
//
// ${file.destination ?? ''}
//
${header}
#import "${options.className ?? ''}.h"

@implementation ${options.className ?? ''}

+ (NSDictionary *)getProperty:(NSString *)keyPath {
  return [[self properties] valueForKeyPath:keyPath];
}

+ (nonnull)getValue:(NSString *)keyPath {
  return [[self properties] valueForKeyPath:[NSString stringWithFormat:@"%@.value", keyPath]];
}

+ (NSDictionary *)properties {
  static NSDictionary * dictionary;
  static dispatch_once_t onceToken;

  dispatch_once(&onceToken, ^{
    dictionary = ${buildDictionary(dictionary.tokens, options)};
  });

  return dictionary;
}

@end

`;