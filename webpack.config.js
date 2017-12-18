var path = require('path')
var webpack = require('webpack')
var ExtractTextPlugin = require("extract-text-webpack-plugin");

module.exports = {
  devtool: 'source-map',
  context: __dirname,
  entry: path.join(__dirname, 'frontend', 'index.jsx'),
  output: {
    path: path.join(__dirname, 'public', 'assets'),
    filename: 'bundle.js',
    publicPath: '/assets/'
  },
  plugins: [
    new ExtractTextPlugin("[name].css"),
    new webpack.optimize.UglifyJsPlugin({
      compressor: {
        warnings: false
      }
    }),
    new webpack.optimize.OccurrenceOrderPlugin()
  ],
  module: {
    rules: [{
        test: /\.(jpe?g|png|gif|ttf|eot|svg|woff)(\??v?=?[0-9]?\.?[0-9]?\.?[0-9]?)?$/,
        loaders: ["url-loader"]
      },
      {
        test: /\.css$/,
        loader: ExtractTextPlugin.extract({
          fallback: 'style-loader',
          use: [{
            loader: 'css-loader'
          }]
        })
      },
      {
        test: /\.s[ca]ss$/,
        use: ExtractTextPlugin.extract({
          fallback: 'style-loader',
          use: [{
            loader: 'css-loader',
            options: {
              sourceMap: true,
              modules: false // Breaks Bootstrap styling
            }
          }, {
            loader: 'sass-loader',
            options: {
              sourceMap: true,
              includePaths: [
                path.resolve(__dirname, "./node_modules"),
              ].concat(require("bourbon").includePaths)
            }
          }]
        })
      },
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env', '@babel/react'],
            sourceMap: true
          }
        }
      },
      {
        test: require.resolve('jquery'),
        loaders: ['expose-loader?$', 'expose-loader?jquery', 'expose-loader?jQuery']
      }
    ]
  }
}