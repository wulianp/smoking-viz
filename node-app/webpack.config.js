const path = require('path')
const webpack = require('webpack')

const ExtractTextPlugin = require('extract-text-webpack-plugin')
const CopyWebpackPlugin = require('copy-webpack-plugin')

const paths = {
  src: path.join(__dirname, 'src'),
  dist: path.join(__dirname, 'dist'),
  data: path.join(__dirname, 'data')
} 

// TODO: Figure out why we need to include app.js and resolve the
//       jQuery
module.exports = {
  context: paths.src,
  entry: {
    common: [
        path.resolve(__dirname, 'src') + '/js/bootstrap-checkbox-radio.js',
        path.resolve(__dirname, 'src') + '/js/bootstrap.min.js',
        path.resolve(__dirname, 'src') + '/js/bootstrap-notify.js',
        path.resolve(__dirname, 'src') + '/js/chartist.min.js',
        path.resolve(__dirname, 'src') + '/js/demo.js',
        path.resolve(__dirname, 'src') + '/js/paper-dashboard.js',
        './main.scss'
    ],
    user: [
        path.resolve(__dirname, 'src') + '/js/map-viz.js'
    ],
    cohort: [
        path.resolve(__dirname, 'src') + '/js/correlation_scatterplots.js'
    ]
  },
  output: {
    filename: '[name].bundle.js',
    path: paths.dist,
    publicPath: 'dist',
  },

  externals: {
    jquery: 'jQuery'
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: [/node_modules/],
        use: [{
          loader: 'babel-loader',
          options: { presets: ['es2015', 'stage-0'] },
        }],
      },
      {
        test: /\.scss$/,
        use: ExtractTextPlugin.extract([
          'css-loader', 'sass-loader'
        ]),
      }
    ],
  },
  devServer: {
    historyApiFallback: true,
    contentBase: paths.dist,
    compress: true,
    port: '4800',
    stats: 'errors-only',
  },
  plugins: [
    new ExtractTextPlugin({
      filename: 'main.bundle.css',
      allChunks: true,
    }),
    new webpack.ProvidePlugin({
      $: "jquery",
      jQuery: "jquery"
    }),
    new webpack.optimize.CommonsChunkPlugin({
      name: "common",
      chunks: ["common"]
    }),  
    new CopyWebpackPlugin([
      {
        from: paths.data,
        to: paths.dist + '/data'
      }
    ])
  ],
}
