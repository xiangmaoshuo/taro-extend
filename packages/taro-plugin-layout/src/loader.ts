import * as webpack from 'webpack';

export default function loader(this: webpack.LoaderContext<any>) {
  return `
  import Layout from '${this.resourcePath}';
  export default function extendComponent (component) {
    const NewComponent = () => (<Layout Page={component} />);
    Object.keys(component).forEach(key => {
      NewComponent[key] = component[key];
    });
    return NewComponent;
  }
  `;
}
