import { defineConfig } from 'dumi';

const development = process.env.NODE_ENV !== 'production';
const DEFAULT_ENV = 'dev';

const {
  DEPLOY_ENV = DEFAULT_ENV,
  PUBLIC_PATH_DEV,
  PUBLIC_PATH_QA,
  PUBLIC_PATH_PROD,
  APP_ID,
} = process.env;

const publicPathMap = {
  dev: `${PUBLIC_PATH_DEV}/${APP_ID}/`,
  qa: `${PUBLIC_PATH_QA}/${APP_ID}/`,
  prod: `${PUBLIC_PATH_PROD}/${APP_ID}/`,
};

const repo = 'taro-extend';

export default defineConfig({
  title: repo,
  hash: true,
  plugins: [require.resolve('./plugins/dumi-combine-changelog')],
  devServer: {
    port: 8200,
  },
  mode: 'site',
  resolve: {
    includes: ['./docs', './packages'],
  },
  publicPath: development ? '/' : publicPathMap[DEPLOY_ENV],
  extraBabelPlugins: [],
});
