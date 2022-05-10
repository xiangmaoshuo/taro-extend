import { IPluginContext } from '@tarojs/service';
import path from 'path';

const ADD_LAYOUT_LOADER = 'add-layout-loader';
const APP_CONFIG_PATH = '/src/app.config';

export default (ctx: IPluginContext, { appConfigPath = APP_CONFIG_PATH }) => {
  const {
    helper: { resolveMainFilePath, readConfig },
  } = ctx;

  // 获取appConfig配置
  const fullAppConfigPath = resolveMainFilePath(
    `${ctx.appPath}${appConfigPath}`,
  );

  // 查看全局layout配置
  const { layout } = readConfig(fullAppConfigPath);

  // 得到全局layout配置
  const initLayout =
    layout === true ? `${ctx.appPath}/src/layout/index` : layout;

  let pageLayout: string = initLayout;

  ctx.modifyWebpackChain((res) => {
    const { chain } = res;

    // 插入自定义loader，用于处理layout
    chain.module
      .rule('add-layout')
      .resourceQuery(/layout/)
      .use(ADD_LAYOUT_LOADER)
      .loader(path.resolve(__dirname, './loader.js'))
      .end();

    chain.plugin('miniPlugin').tap((args: any[]) => {
      const { modifyConfig, modifyInstantiate, ...restConfig } =
        args[0].loaderMeta || {};

      // 修改loaderMeta配置，注入modifyConfig和modifyInstantiate方法
      args[0].loaderMeta = {
        ...restConfig,
        // 该方法会在处理page时调用
        modifyConfig(config: any) {
          pageLayout = config.layout ?? initLayout;
        },
        // 该方法会在处理app和page时调用，通过type区分
        modifyInstantiate(str: string, type: 'page' | 'app') {
          modifyInstantiate?.(str, type);

          // 修改页面生成方式，注入layout
          if (type === 'page' && pageLayout) {
            return `
              import extendComponent from '${pageLayout}?layout=1'
              ${str.replace('component', 'extendComponent(component)')}
              `;
          }
          return str;
        },
      };
      return args;
    });
  });

  // 生成小程序config文件之前，进行修改
  ctx.modifyMiniConfigs(({ configMap }) => {
    Object.keys(configMap).forEach((key) => {
      delete configMap[key].content.layout;
    });
  });
};
