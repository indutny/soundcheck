'use strict';

const path = require('path');

const DIST = path.join(__dirname, 'dist');
const LIB = path.join(__dirname, 'lib');

const loaders = [
  {
    test: /\.js$/,
    loader: 'babel-loader',
    query: {
      presets: [ 'es2015', 'react' ]
    }
  }
];

module.exports = [{
  target: 'web',
  entry: path.join(LIB, 'soundcheck.js'),
  output: {
    path: DIST,
    filename: 'bundle.js'
  },
  module: {
    loaders: loaders
  }
}];
