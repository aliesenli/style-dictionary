import StyleDictionary from 'style-dictionary';
import { parse, formatHex, formatHex8, oklch, formatCss } from 'culori';
import { lightTokens } from './tokens/light';
import { darkTokens } from './tokens/dark';

interface MonacoTheme {
  base?: string;
  inherit?: boolean;
  colors: Record<string, string>;
  rules?: MonacoToken[];
}
interface MonacoToken {
  background?: string;
  forground?: string;
  token?: string;
}

interface VSCodeTheme {
  name: string;
  type: string;
  colors: Record<string, string>;
  tokenColors?: TokenColor[];
}

interface TokenColor {
  scope: string[] | string;
  settings: {
    foreground?: string;
    fontStyle?: string;
  };
}

const sd = new StyleDictionary({
  hooks: {
    transforms: {
      color: {
        type: 'value',
        transitive: true,
        filter: (token) => {
          return token.path[0] === 'color';
        },
        transform: (token) => {
          const color = parse(token.$value);

          if (color && token.modify) {
            color.alpha = token.modify.alpha;
          }

          if (color && color.alpha) {
            return formatHex8(color);
          }

          return formatHex(color);
        },
      },
      cssColor: {
        type: 'value',
        transitive: true,
        filter: (token) => {
          return token.path[0] === 'color';
        },
        transform: (token) => {
          const color = parse(token.$value);

          if (color && token.modify) {
            color.alpha = token.modify.alpha;
          }

          return formatCss(oklch(color));
        },
      },
      vsCodeName: {
        type: 'name',
        transform: (token) => {
          // syntax tokens we remove the first part of the object path
          if (token.path[0] === 'syntax') {
            // This allows you to have tokens at multiple levels
            // like `comment` and `comment.line`
            if (token.name === '*') {
              // removes the first and last parts of the path
              return token.path.slice(1, -1).join('.');
            } else {
              // removes the first part of the path which would be 'syntax'
              return token.path.slice(1).join('.');
            }
          } else {
            // Used for application colors
            return token.path.join('.');
          }
        },
      },
    },
    formats: {
      monaco: ({ dictionary, platform }) => {
        const theme: MonacoTheme = {
          base: platform.themeType === 'dark' ? 'vs-dark' : 'vs',
          inherit: true,
          rules: [],
          colors: {},
        };
        // Filter out the design tokens we don't want to add to the
        dictionary.allTokens
          .filter((token) => {
            return !['color', 'syntax'].includes(token.path[0]);
          })
          .forEach((token) => {
            // Add each token to the colors object, the name is generated by the custom
            // transform defined above
            theme.colors[token.name] = token.$value;
          });

        // Map the syntax styles
        theme.rules = dictionary.allTokens
          .filter((token) => {
            return token.path[0] === 'syntax';
          })
          .map((token) => ({
            token: token.name,
            foreground: token.$value,
            fontStyle: token.fontStyle,
          }));

        // Style Dictionary formats expect a string that will be then written to a file
        return JSON.stringify(theme, null, 2);
      },
      vsCodeTheme: ({ dictionary, platform }) => {
        // VSCode theme JSON files have this structure
        const theme: VSCodeTheme = {
          name: `Nu Disco ${platform.themeType}`,
          type: platform.themeType,
          colors: {},
        };

        // Filter out the design tokens we don't want to add to the
        // 'colors' object. This includes core colors defined in tokens/core.json5
        // and syntax tokens defined in tokens/syntax
        dictionary.allTokens
          .filter((token) => {
            return !['color', 'syntax'].includes(token.path[0]);
          })
          .forEach((token) => {
            // Add each token to the colors object, the name is generated by the custom
            // transform defined above
            theme.colors[token.name] = token.$value;
          });

        // Map the syntax styles
        theme.tokenColors = dictionary.allTokens
          .filter((token) => {
            return token.path[0] === 'syntax';
          })
          .map((token) => ({
            scope: token.name,
            settings: {
              foreground: token.$value,
              fontStyle: token.fontStyle,
            },
          }));

        // Style Dictionary formats expect a string that will be then written to a file
        return JSON.stringify(theme, null, 2);
      },
    },
    filters: {
      css: (token) => {
        return token.$type === 'color';
      },
    },
  },
});

// wrapper async function for putting stuff in sequence
const runSD = async (mode: string) => {
  const sdExt = await sd.extend({
    tokens: mode === 'light' ? lightTokens : darkTokens,

    platforms: {
      vscode: {
        // Directory to build files to
        buildPath: `docs/theme/dist/`,
        // Adding a custom attribute on the platform so we can use it in
        // the custom format
        themeType: mode,
        // The name of the custom transform we defined above
        transforms: [`color`, `vsCodeName`],
        files: [
          {
            // The path the file will be created at. Make sure this matches
            // the file paths defined in the package.json
            destination: `${mode}.vscode.json`,
            // The name of the custom format defined above
            format: `vsCodeTheme`,
          },
          {
            // The path the file will be created at. Make sure this matches
            // the file paths defined in the package.json
            destination: `${mode}.monaco.json`,
            // The name of the custom format defined above
            format: `monaco`,
          },
        ],
      },
      css: {
        buildPath: `docs/theme/dist/`,
        transforms: ['attribute/cti', 'name/kebab', 'cssColor'],
        prefix: 'sl',
        files: [
          {
            destination: `${mode}.variables.css`,
            format: 'css/variables',
            filter: (token) => {
              // light mode don't include the core colors
              // because default is dark mode which will have the core colors
              if (mode === 'light') {
                return token.path[0] === 'color' && token.path[1] !== 'core';
              } else {
                return token.path[0] === 'color';
              }
            },
            options: {
              selector: mode === 'light' ? `:root[data-theme='light']` : `:root`,
              // outputReferences: true,
            },
          },
        ],
      },
    },
  });
  await sdExt.buildAllPlatforms();
};

// to run stuff in parallel
await Promise.all(['dark', 'light'].map(runSD));