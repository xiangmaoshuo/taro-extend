const { resolve, join } = require('path');
const { existsSync } = require('fs');
const commonjs = require('@rollup/plugin-commonjs');
const requireContext = require('rollup-plugin-require-context');
const babel = require('@rollup/plugin-babel').default;
const typescript = require('rollup-plugin-typescript2');
const postcss = require('rollup-plugin-postcss');
const lessSyntax = require('postcss-less');
const clear = require('rollup-plugin-clear');
const nodeResolve = require('@rollup/plugin-node-resolve').default;
const {
  BABEL_CONFIG_FILE,
  TS_CONFIG_FILE,
  ROLLUP_TYPE_WATCH,
  jsExtensions,
} = require('./constants');

const clearDirs = ['es', 'lib'];
const noDeclarationFiles = { compilerOptions: { declaration: false } };
const root = resolve(__dirname, '../');
const rollupType = process.env.ROLLUP_TYPE;

const makeExternalPredicate = (externalArr) => {
  if (externalArr.length === 0) {
    return () => false;
  }
  const pattern = new RegExp(`^(${externalArr.join('|')})($|/)`);
  return (id) => pattern.test(id);
};

module.exports = function getRollupConfig() {
  const cwd = process.cwd();
  const pkg = require(resolve(cwd, 'package.json'));
  const rootPkg = require(resolve(root, 'package.json'));
  const babelRuntimeVersion = rootPkg.dependencies['@babel/runtime'].replace(
    /^[^0-9]*/,
    '',
  );

  const getConfigFile = (type) => {
    let configFileType;
    switch (type) {
      case 'babel':
        configFileType = BABEL_CONFIG_FILE;
        break;
      case 'ts':
        configFileType = TS_CONFIG_FILE;
        break;
      default:
        configFileType = BABEL_CONFIG_FILE;
    }
    const pkgConfigFile = resolve(cwd, configFileType);

    return existsSync(pkgConfigFile)
      ? pkgConfigFile
      : resolve(root, configFileType);
  };

  return [
    // CommonJS
    {
      dir: 'lib',
      format: 'cjs',
    },
    // ES
    {
      dir: 'es',
      format: 'es',
    },
  ].map((module) => {
    let babelRuntimeConfig;
    let tsConfig = { tsconfig: getConfigFile('ts') };
    const { format } = module;
    switch (format) {
      case 'cjs':
        babelRuntimeConfig = { useESModules: false };
        break;
      case 'es':
        tsConfig = { ...tsConfig, tsconfigOverride: noDeclarationFiles };
        babelRuntimeConfig = { useESModules: true };
        break;
    }

    return (entry) => ({
      input: entry,
      output: {
        ...module,
        indent: false,
        exports: 'named',
      },
      external: makeExternalPredicate([
        ...Object.keys(pkg.dependencies || {}),
        ...Object.keys(pkg.peerDependencies || {}),
        ...Object.keys(rootPkg.dependencies || {}),
        ...Object.keys(rootPkg.peerDependencies || {}),
      ]),
      plugins: [
        ROLLUP_TYPE_WATCH === rollupType
          ? null
          : clear({
              targets: clearDirs,
            }),
        postcss({
          extensions: ['.css', '.less'],
          use: [],
          syntax: lessSyntax,
          inject: false,
          extract: 'style/index.less',
        }),
        nodeResolve({
          extensions: jsExtensions,
        }),
        commonjs(),
        typescript(tsConfig),
        // rollup支持require.context
        requireContext({
          include: [/packages\/locale\S+\.(tsx?)$/],
        }),
        babel({
          extensions: jsExtensions,
          configFile: getConfigFile('babel'),
          plugins: [
            [
              '@babel/plugin-transform-runtime',
              { version: babelRuntimeVersion, ...babelRuntimeConfig },
            ],
          ],
          babelHelpers: 'runtime',
        }),
      ].filter(Boolean),
    });
  });
};
