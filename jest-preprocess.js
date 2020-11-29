const babelOptions = {
  presets: ['next/babel', '@babel/preset-typescript']
};

module.exports = require('babel-jest').createTransformer(babelOptions);
