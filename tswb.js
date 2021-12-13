const updateWebpackConfig = require('./webpack-config.js');

/**
 * @typedef { import('@messman/ts-webpack-builder').LibraryBuildOptions } LibraryBuildOptions
 */

/**
 * @type { Partial<LibraryBuildOptions> }
 */
const options = {
	libraryName: 'react-common',
	isNode: false,

	webpackConfigTransform: (webpackConfig, _buildOptions) => {
		updateWebpackConfig(webpackConfig, false);
		return webpackConfig;
	}
};

module.exports = options;