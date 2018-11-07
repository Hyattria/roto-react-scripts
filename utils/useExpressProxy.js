const ProxyMiddleware = require('http-proxy-middleware')

module.exports = (app, proxy) => {
  if (!proxy) {
    return undefined;
  }
  if (typeof proxy !== 'object' && typeof proxy !== 'string') {
    console.log(
      chalk.red(
        'When specified, "proxy" in package.json must be a string or an object.'
      )
    );
    console.log(
      chalk.red('Instead, the type of "proxy" was "' + typeof proxy + '".')
    );
    console.log(
      chalk.red(
        'Either remove "proxy" from package.json, or make it an object.'
      )
    );
    process.exit(1);
  }
  
  Object.keys(proxy).forEach(name => {
    let options = proxy[name]
    if (typeof options === 'string') options = { target: options }
    app.use(ProxyMiddleware(options.filter || name, options))
  })
}
