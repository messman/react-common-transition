// @ts-check
const path = require('path');
const updateWebpackConfig = require('./webpack-config.js');

const webpackConfig = {
	mode: 'development',
	target: 'web',

	resolve: {
		extensions: ['.ts', '.tsx', '.js', '.json'],
		alias: {
			'@': path.resolve(__dirname, './src')
		}
	},
	module: {
		rules: []
	}
};
updateWebpackConfig(webpackConfig, true);

module.exports = webpackConfig;