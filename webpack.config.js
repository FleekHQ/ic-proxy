const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const TerserPlugin = require("terser-webpack-plugin");
const HtmlMinimizerPlugin = require("html-minimizer-webpack-plugin");
const InlineSourceWebpackPlugin = require("inline-source-webpack-plugin");

module.exports = {
  mode: "production",
  entry: {
    bootstrap: "./src/bootstrap/index.js",
    serviceWorker: "./src/bootstrap/serviceWorker.js",
  },
  output: {
    filename: "[name].js",
    path: path.resolve(__dirname, "dist"),
  },
  plugins: [
    new HtmlWebpackPlugin({
      // hash: true,
      chunks: ["bootstrap"],
      title: "Loading...",
      template: path.resolve(__dirname, "./src/bootstrap/template.html"),
      minify: true,
    }),
    new InlineSourceWebpackPlugin(),
  ],

  // node: {
  //   fs: "empty",
  // },

  resolve: {
    fallback: {
      path: require.resolve("path-browserify"),
      fs: false,
    },
  },

  optimization: {
    minimize: true,
    minimizer: [new TerserPlugin(), new HtmlMinimizerPlugin()],
  },

  module: {
    rules: [
      {
        test: /\.(js)$/,
        exclude: /node_modules/,
        use: ["babel-loader"],
      },
    ],
  },
};
