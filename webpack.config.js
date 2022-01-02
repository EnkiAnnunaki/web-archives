const path = require('path');
const {lstatSync, readdirSync} = require('fs');

const webpack = require('webpack');
const LodashModuleReplacementPlugin = require('lodash-webpack-plugin');
const VueLoaderPlugin = require('vue-loader/lib/plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

const storageRevisions = require('./src/storage/config.json').revisions;

const targetEnv = process.env.TARGET_ENV || 'firefox';
const isProduction = process.env.NODE_ENV === 'production';
const enableContributions =
  (process.env.ENABLE_CONTRIBUTIONS || 'true') === 'true';

const plugins = [
  new webpack.DefinePlugin({
    'process.env': {
      TARGET_ENV: JSON.stringify(targetEnv),
      STORAGE_REVISION_LOCAL: JSON.stringify(
        storageRevisions.local[storageRevisions.local.length - 1]
      ),
      ENABLE_CONTRIBUTIONS: JSON.stringify(enableContributions.toString())
    }
  }),
  new webpack.ProvidePlugin({
    Buffer: ['buffer', 'Buffer']
  }),
  new VueLoaderPlugin(),
  new MiniCssExtractPlugin({
    filename: '[name]/style.css'
  }),
  isProduction ? new LodashModuleReplacementPlugin({shorthands: true}) : null
].filter(Boolean);

const enginesRootDir = path.join(__dirname, 'src/engines');
const engines = readdirSync(enginesRootDir)
  .filter(file => lstatSync(path.join(enginesRootDir, file)).isFile())
  .map(file => file.split('.')[0]);
const entries = Object.fromEntries(
  engines.map(engine => [engine, `./src/engines/${engine}.js`])
);

if (enableContributions) {
  entries.contribute = './src/contribute/main.js';
}

module.exports = {
  mode: isProduction ? 'production' : 'development',
  entry: {
    background: './src/background/main.js',
    options: './src/options/main.js',
    action: './src/action/main.js',
    insert: './src/insert/main.js',
    tab: './src/tab/main.js',
    ...entries
  },
  output: {
    path: path.resolve(__dirname, 'dist', targetEnv, 'src'),
    filename: pathData => {
      return engines.includes(pathData.chunk.name)
        ? 'engines/[name]/script.js'
        : '[name]/script.js';
    },
    chunkFilename: '[name]/script.js'
  },
  optimization: {
    splitChunks: {
      cacheGroups: {
        default: false,
        commonsUi: {
          name: 'commons-ui',
          chunks: chunk => {
            return ['options', 'action', 'contribute'].includes(chunk.name);
          },
          minChunks: 2
        },
        commonsEngine: {
          name: 'commons-engine',
          chunks: chunk => engines.includes(chunk.name),
          minChunks: 2
        }
      }
    }
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        use: 'babel-loader'
      },
      {
        test: /\.vue$/,
        use: [
          {
            loader: 'vue-loader',
            options: {
              transformAssetUrls: {img: ''}
            }
          }
        ]
      },
      {
        test: /\.(c|sc|sa)ss$/,
        use: [
          MiniCssExtractPlugin.loader,
          'css-loader',
          'postcss-loader',
          {
            loader: 'sass-loader',
            options: {
              sassOptions: {
                includePaths: ['node_modules'],
                quietDeps: true
              }
            }
          }
        ]
      }
    ]
  },
  resolve: {
    modules: [path.resolve(__dirname, 'src'), 'node_modules'],
    extensions: ['.js', '.json', '.css', '.scss', '.vue'],
    fallback: {fs: false}
  },
  devtool: false,
  plugins
};
