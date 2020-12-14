const HtmlWebpackPlugin = require("html-webpack-plugin");
const path = require("path");
const webpack = require("webpack");
const config = require("./package.json");

module.exports = {
  entry: path.resolve(__dirname, "src", config.main),
  devtool: "source-map",
  output: {
    path: path.resolve(__dirname, "build")
  },
  mode: 'development',
  plugins: [
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, "./src/index.html")
    }),
    new webpack.DefinePlugin({
      WORKERS: JSON.stringify(process.env.WORKERS),
      BOIDS: JSON.stringify(process.env.BOIDS),
      INTERFACE: JSON.stringify(process.env.INTERFACE)
    })
  ],
  module: {
    rules: [
      {
        test: /\Worker\.js$/,
        use: { loader: 'worker-loader' },
      },
    ],
  },
  devServer: {
    https: true,
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "require-corp"
    }
  }
}
