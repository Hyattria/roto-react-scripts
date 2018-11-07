const webpack = require('webpack')
const path = require("path");
const paths = require("./paths");

const HtmlWebpackPlugin = require("html-webpack-plugin");
const ManifestPlugin = require("webpack-manifest-plugin");
const CaseSensitivePathsPlugin = require("case-sensitive-paths-webpack-plugin");
const FriendlyErrorsWebpackPlugin = require('friendly-errors-webpack-plugin');
const ProgressBarPlugin = require('progress-bar-webpack-plugin');

const ModuleScopePlugin = require("react-dev-utils/ModuleScopePlugin");
const getCSSModuleLocalIdent = require('react-dev-utils/getCSSModuleLocalIdent');

const getClientEnvironment = require("./env");

const publicPath = "./";
const env = getClientEnvironment("");

// common function to get style loaders
const getStyleLoaders = (cssOptions, preProcessor) => {
  const loaders = [
    require.resolve('style-loader'),
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
      },
    },
  ];
  if (preProcessor) {
    loaders.push(require.resolve(preProcessor));
  }
  return loaders;
};

module.exports = {
  mode: 'development',
  devtool: "cheap-module-source-map",
  entry: [
    require.resolve("babel-polyfill"),
    require.resolve('../utils/devClient.js'),
    paths.appIndexJs
  ],
  output: {
    pathinfo: true,
    filename: "static/js/bundle.js",
    chunkFilename: "static/js/[name].chunk.js",
    publicPath: publicPath,
    devtoolModuleFilenameTemplate: info =>
      path.resolve(info.absoluteResourcePath).replace(/\\/g, "/")
  },
  optimization: {
    splitChunks: {
      chunks: "all",
      name: true
    },
    runtimeChunk: true,
    noEmitOnErrors: true
  },
  resolve: {
    modules: ["node_modules", paths.appNodeModules],
    extensions: [".web.js", ".mjs", ".js", ".json", ".web.jsx", ".jsx"],
    alias: {
      'react-native': 'react-native-web'
    },
    plugins: [
      // Prevents users from importing files from outside of src/ (or node_modules/).
      // This often causes confusion because we only process files within src/ with babel.
      // To fix this, we prevent you from importing files out of src/ -- if you'd like to,
      // please link the files into your node_modules/ and let module-resolution kick in.
      // Make sure your source files are compiled, as they will not be processed in any way.
      new ModuleScopePlugin(paths.appSrc, [paths.appPackageJson])
    ]
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
              formatter: require.resolve('react-dev-utils/eslintFormatter'),
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
        // "oneOf" will traverse all following loaders until one will
        // match the requirements. When no loader matches it will fall
        // back to the "file" loader at the end of the loader list.
        oneOf: [
          // "url" loader works like "file" loader except that it embeds assets
          // smaller than specified limit in bytes as data URLs to avoid requests.
          // A missing `test` is equivalent to a match.
          {
            test: [/\.bmp$/, /\.gif$/, /\.jpe?g$/, /\.png$/],
            loader: require.resolve("url-loader"),
            options: {
              limit: 10000,
              name: "static/image/[name].[hash:8].[ext]"
            }
          },
          {
            test: /\.(js|jsx)$/,
            include: [paths.appSrc],
            exclude: [/[/\\\\]node_modules[/\\\\]/],
            use: [
              {
                loader: require.resolve("thread-loader"),
                options: {
                  poolTimeout: Infinity
                }
              },
              {
                loader: require.resolve("babel-loader"),
                options: {
                  babelrc: false,
                  plugins: [
                    "transform-decorators-legacy",
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
            use: getStyleLoaders({
              importLoaders: 1
            }),
          },
          {
            test: /\.module\.css$/,
            use: getStyleLoaders({
              importLoaders: 1,
              modules: true,
              getLocalIdent: getCSSModuleLocalIdent,
            }),
          },
          {
            test: /\.(scss|sass)$/,
            exclude:/\.module\.(scss|sass)$/,
            use: getStyleLoaders({
              importLoaders: 2  
            }, 'sass-loader')
          },
          {
            test: /\.module\.(scss|sass)$/,
            use: getStyleLoaders({
              importLoaders: 2,
              modules: true,
              getLocalIdent: getCSSModuleLocalIdent
            }, 'sass-loader')
          },
          {
            // Exclude `js` files to keep "css" loader working as it injects
            // its runtime that would otherwise be processed through "file" loader.
            // Also exclude `html` and `json` extensions so they get processed
            // by webpacks internal loaders.
            exclude: [/\.(js|mjs|jsx|ts|tsx)$/, /\.html$/, /\.json$/],
            loader: require.resolve('file-loader'),
            options: {
              name: 'static/media/[name].[hash:8].[ext]',
            },
          }
        ]
      }
    ]
  },
  plugins: [
    // Generates an `index.html` file with the <script> injected.
    new HtmlWebpackPlugin({
      inject: true,
      template: paths.appHtml
    }),
    new webpack.HotModuleReplacementPlugin(),
    new webpack.DefinePlugin(env.stringified),
    new FriendlyErrorsWebpackPlugin(),
    new ProgressBarPlugin(),
    new CaseSensitivePathsPlugin(),
    new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/),
    new ManifestPlugin({
      fileName: 'asset-manifest.json',
      publicPath: publicPath,
    }),
    
  ],
  // Some libraries import Node modules but don't use them in the browser.
  // Tell Webpack to provide empty mocks for them so importing them works.
  node: {
    dgram: 'empty',
    fs: 'empty',
    net: 'empty',
    tls: 'empty',
    child_process: 'empty',
  },
  // Turn off performance processing because we utilize
  // our own hints via the FileSizeReporter
  performance: false,
}