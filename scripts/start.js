// Do this as the first thing so that any code reading it knows the right env.
process.env.BABEL_ENV = "development";
process.env.NODE_ENV = "development";

const webpack = require('webpack');
const paths = require("../config/paths");
const express = require('express');
const chalk = require('chalk');

const webpackMiddleware = require('webpack-dev-middleware')
const webpackHotMiddleware = require('webpack-hot-middleware')

const devConfig = require('../config/webpack.dev.config');
// Load proxy config
const proxySetting = require(paths.appPackageJson).proxy;
const useExpressProxy = require('../utils/useExpressProxy')

const app = express()
const compiler = webpack(devConfig)

const devMiddleware = webpackMiddleware(compiler, {
  publicPath: '/',
  logLevel: 'silent',
  hot: true
})

const hotMiddleware = webpackHotMiddleware(compiler, {
  log: () => {}
})

compiler.hooks.compilation.tap('html-webpack-plugin-after-emit', () => {
  hotMiddleware.publish({
    action: 'reload'
  })
})

app.use(devMiddleware)
app.use(hotMiddleware)

useExpressProxy(app, proxySetting)

devMiddleware.waitUntilValid(() => {
  console.log(chalk.yellow(`I am ready. open http://localhost:3000 to see me.`))
})

app.listen(3000)