function plugin(api) {
  api.onPatchRoutesBefore((ctx) => {
    if (!ctx.parentRoute) {
      const result = removeChangeLogRoute(ctx.routes);

      // clear original routes
      ctx.routes.splice(0, ctx.routes.length);

      // append new routes
      ctx.routes.push(...result);
    }

    function removeChangeLogRoute(routes) {
      return routes.filter((route) => {
        if (route.path.includes('changelog')) {
          return false;
        }
        if (route.routes) {
          route.routes = removeChangeLogRoute(route.routes);
        }
        return true;
      });
    }
  });

  api.chainWebpack((config) => {
    const babelLoader = config.module.rule('js').use('babel-loader').entries();

    config.module.rules.delete('dumi');
    config.module
      .rule('dumi')
      .test(/\.md$/)
      .exclude.add(/CHANGELOG/)
      .end()
      .use('babel-loader')
      .loader(babelLoader.loader)
      .options(babelLoader.options)
      .end()
      .use('dumi-loader')
      .loader(require.resolve('./loader'))
  });
}

module.exports = plugin;
