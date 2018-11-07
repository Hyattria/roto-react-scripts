"use strict";

const path = require("path");
const webpack = require("webpack");

const HtmlWebpackPlugin = require("html-webpack-plugin");
const UglifyJsPlugin = require("uglifyjs-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

const OptimizeCSSAssetsPlugin = require("optimize-css-assets-webpack-plugin");
const ManifestPlugin = require("webpack-manifest-plugin");
const ProgressBarPlugin = require('progress-bar-webpack-plugin');

const eslintFormatter = require("react-dev-utils/eslintFormatter");
const ModuleScopePlugin = require("react-dev-utils/ModuleScopePlugin");

const paths = require("./paths");
const getClientEnvironment = require("./env");

// Webpack uses `publicPath` to determine where the app is being served from.
// It requires a trailing slash, or the file assets will get an incorrect path.
const publicPath = "./";
const shouldUseRelativeAssetPaths = publicPath === './';
// Source maps are resource heavy and can cause out of memory issue for large source files.
const shouldUseSourceMap = false;
// Omit trailing slash as %PUBLIC_URL%/xyz looks better than %PUBLIC_URL%xyz.
const publicUrl = publicPath.slice(0, -1);
// Get environment variables to inject into our app.
const env = getClientEnvironment(publicUrl);

if (env.stringified["process.env"].NODE_ENV !== '"production"') {
  throw new Error("Production builds must have NODE_ENV=production.");
}

// common function to get style loaders
const getStyleLoaders = (cssOptions, preProcessor) => {
  const loaders = [
    {
      loader: MiniCssExtractPlugin.loader,
      options: Object.assign(
        {},
        shouldUseRelativeAssetPaths ? { publicPath: '../../' } : undefined
      ),
    },
    {
      loader: require.resolve('css-loader'),
      options: cssOptions,
    },
    {
      // Options for PostCSS as we reference these options twice
      // Adds vendor prefixing based on your specified browser support in
      // package.json
      loader: require.resolve('postcss-loader'),
      options: {
        // Necessary for external CSS imports to work
        // https://github.com/facebook/create-react-app/issues/2677
        ident: 'postcss',
        plugins: () => [
          require('postcss-flexbugs-fixes'),
          require('postcss-preset-env')({
            autoprefixer: {
              flexbox: 'no-2009',
            },
            stage: 3,
          }),
        ],
        sourceMap: shouldUseSourceMap,
      },
    },
  ];
  if (preProcessor) {
    loaders.push({
      loader: require.resolve(preProcessor),
      options: {
        sourceMap: shouldUseSourceMap,
      },
    });
  }
  return loaders;
};

module.exports = {
  mode: 'production',
  bail: true,

  devtool: false,
  entry: [require.resolve("babel-polyfill"), paths.appIndexJs],
  output: {
    // The build folder.
    path: paths.appBuild,
    // Generated JS file names (with nested folders).
    // There will be one main bundle, and one file per asynchronous chunk.
    // We don't currently advertise code splitting but Webpack supports it.
    filename: 'static/js/[name].[chunkhash:8].js',
    chunkFilename: 'static/js/[name].[chunkhash:8].chunk.js',
    // We inferred the "public path" (such as / or /my-project) from homepage.
    publicPath: publicPath,
    // Point sourcemap entries to original disk location (format as URL on Windows)
    devtoolModuleFilenameTemplate: info =>
      path
        .relative(paths.appSrc, info.absoluteResourcePath)
        .replace(/\\/g, '/'),
  },
  optimization: {
    minimizer: [
      new UglifyJsPlugin({
        uglifyOptions: {
          parse: {
            // we want uglify-js to parse ecma 8 code. However, we don't want it
            // to apply any minfication steps that turns valid ecma 5 code
            // into invalid ecma 5 code. This is why the 'compress' and 'output'
            // sections only apply transformations that are ecma 5 safe
            // https://github.com/facebook/create-react-app/pull/4234
            ecma: 8
          },
          compress: {
            ecma: 5,
            warnings: false,
            // Disabled because of an issue with Uglify breaking seemingly valid code:
            // https://github.com/facebook/create-react-app/issues/2376
            // Pending further investigation:
            // https://github.com/mishoo/UglifyJS2/issues/2011
            comparisons: false
          },
          mangle: {
            safari10: true
          },
          output: {
            ecma: 5,
            comments: false,
            // Turned on because emoji and regex is not minified properly using default
            // https://github.com/facebook/create-react-app/issues/2488
            ascii_only: true
          }
        },
        // Use multi-process parallel running to improve the build speed
        // Default number of concurrent runs: os.cpus().length - 1
        parallel: true,
        // Enable file caching
        cache: true,
        sourceMap: shouldUseSourceMap
      }),
      new OptimizeCSSAssetsPlugin()
    ],
    // Automatically split vendor and commons
    // https://twitter.com/wSokra/status/969633336732905474
    // https://medium.com/webpack/webpack-4-code-splitting-chunk-graph-and-the-splitchunks-optimization-be739a861366
    splitChunks: {
      chunks: "all",
      name: true
    },
    // Keep the runtime chunk seperated to enable long term caching
    // https://twitter.com/wSokra/status/969679223278505985
    runtimeChunk: true
  },
  resolve: {
    modules: ["node_modules", paths.appNodeModules],
    extensions: [".web.js", ".mjs", ".js", ".json", ".web.jsx", ".jsx"],
    // temp fix bugs: Module not found: Can't resolve '@babel/runtime/helpers/builtin/es6/extends' in '/Users/0002855/Documents/shihang/test-app/node_modules/react-spring/dist'
    plugins: [new ModuleScopePlugin(paths.appSrc, [paths.appPackageJson])]
  },
  module: {
    strictExportPresence: true,
    rules: [
      { parser: { requireEnsure: false } },

      {
        test: /\.(js|jsx|mjs)$/,
        enforce: "pre",
        use: [
          {
            options: {
              formatter: eslintFormatter,
              eslintPath: require.resolve("eslint"),

              baseConfig: {
                extends: [require.resolve("eslint-config-react-app")]
              },
              ignore: false,
              useEslintrc: false
            },
            loader: require.resolve("eslint-loader")
          }
        ],
        include: paths.appSrc,
        exclude: [/[/\\\\]node_modules[/\\\\]/]
      },
      {
        oneOf: [
          {
            test: [/\.bmp$/, /\.gif$/, /\.jpe?g$/, /\.png$/],
            loader: require.resolve("url-loader"),
            options: {
              limit: 10000,
              name: "static/media/[name].[hash:8].[ext]"
            }
          },
          {
            test: /\.(js|jsx|mjs)$/,
            include: paths.appSrc,
            exclude: [/[/\\\\]node_modules[/\\\\]/],
            use: [
              require.resolve("thread-loader"),
              {
                loader: require.resolve("babel-loader"),
                options: {
                  babelrc: false,
                  plugins: [
                    "transform-decorators-legacy",
                    // babel-plugin-import 按需加载组件样式和代码
                    ["import", { "libraryName": "antd", "libraryDirectory": "es", "style": "css" }]
                  ],
                  presets: [["env"], "stage-1", "react"],
                  cacheDirectory: true,
                  highlightCode: true
                }
              }
            ]
          },
          {
            test: /\.css$/,
            exclude: /\.module\.css$/,
            loader: getStyleLoaders({
              importLoaders: 1,
              sourceMap: shouldUseSourceMap,
            }),
          },
          {
            test: /\.(scss|sass)$/,
            exclude:/\.module\.(scss|sass)$/,
            loader: getStyleLoaders(
              {
                importLoaders: 2,
                sourceMap: shouldUseSourceMap,
              },
              'sass-loader'
            ),
          },
          {
            loader: require.resolve("file-loader"),
            exclude: [/\.(js|jsx|mjs)$/, /\.html$/, /\.json$/],
            options: {
              name: "static/media/[name].[hash:8].[ext]"
            }
          }
        ]
      }
    ]
  },
  plugins: [
    new ProgressBarPlugin(),
    // Generates an `index.html` file with the <script> injected.
    new HtmlWebpackPlugin(Object.assign({}, env.raw, {
      createTime: new Date().toString()
    }, {
      inject: true,
      template: paths.appHtml,
      minify: {
        removeComments: true,
        collapseWhitespace: true,
        removeRedundantAttributes: true,
        useShortDoctype: true,
        removeEmptyAttributes: true,
        removeStyleLinkTypeAttributes: true,
        keepClosingSlash: true,
        minifyJS: true,
        minifyCSS: true,
        minifyURLs: true
      }
    } )),
    // Makes some environment variables available to the JS code, for example:
    // if (process.env.NODE_ENV === 'production') { ... }. See `./env.js`.
    // It is absolutely essential that NODE_ENV was set to production here.
    // Otherwise React will be compiled in the very slow development mode.
    new webpack.DefinePlugin(env.stringified),
    new MiniCssExtractPlugin({
      // Options similar to the same options in webpackOptions.output
      // both options are optional
      filename: "static/css/[name].[contenthash:8].css",
      chunkFilename: "static/css/[name].[contenthash:8].chunk.css"
    }),
    // Generate a manifest file which contains a mapping of all asset filenames
    // to their corresponding output file so that tools can pick it up without
    // having to parse `index.html`.
    new ManifestPlugin({
      fileName: "asset-manifest.json",
      publicPath: publicPath
    }),
    // new BuildInfoPlugin({
    //   name: "build.json",
    //   info: {
    //     gitLogs:gitLogs
    //   }
    // }),
    new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/)
    ],
    node: {
      dgram: "empty",
      fs: "empty",
      net: "empty",
      tls: "empty",
      child_process: "empty"
    },
    performance: false
}