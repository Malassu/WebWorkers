const HtmlWebpackPlugin = require("html-webpack-plugin");
const path = require("path");
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
    https: true
  }
}
