const transformer = require('@umijs/preset-dumi/lib/transformer').default;
const getTheme =  require('@umijs/preset-dumi/lib/theme/loader').default;

const path = require('path');
const fs = require('fs');

let useKatexFilePath = '';

async function loader(sourceContent) {
  let content = sourceContent;

  const changelogPath = path.join(path.dirname(this.resource), 'CHANGELOG.md');
  if (fs.existsSync(changelogPath)) {
    // eslint-disable-next-line prefer-template
    content += '\n' + fs.readFileSync(changelogPath, 'utf-8');
  }

  const result = transformer.markdown(content, this.resource, {
    noCache: content !== sourceContent
  });

  /**
   * 升级dumi版本后，对应@umijs/preset-dumi/lib中的transformer方法参数发生变化，
   * 需重新修改loader方法。详细见@umijs/preset-dumi/lib/loader方法实现
   */
  const theme = await getTheme();

   if (result.content.includes('className={["katex"]}') && !useKatexFilePath) {
    useKatexFilePath = this.resource;
  }

  return `
    import React from 'react';
    import { Link, AnchorLink } from 'dumi/theme';
    import DUMI_ALL_DEMOS from '@@/dumi/demos';
    ${
      // add Katex css import statement if required or not in production mode, to reduce dist size
      useKatexFilePath === this.resource || process.env.NODE_ENV !== 'production'
        ? "import 'katex/dist/katex.min.css';"
        : ''
    }
    ${theme.builtins
      .concat(theme.fallbacks)
      .map(component => `import ${component.identifier} from '${component.source}';`)
      .join('\n')}
    ${(result.meta.demos || []).join('\n')}
    export default function () {
      return (
        <>
          ${
            result.meta.translateHelp
              ? '<Alert>This article has not been translated yet. Want to help us out? Click the Edit this doc on GitHub at the end of the page.</Alert>'
              : ''
          }
          ${result.content}
        </>
      );
  }`;
}

module.exports = loader;
