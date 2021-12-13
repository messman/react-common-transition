// @ts-check
const createStyledComponentsTransformer = require('typescript-plugin-styled-components').default;

/**
 * @param {any} webpackConfig
 * @param {boolean} isCosmos
 * */
module.exports = function updateWebpackConfig(webpackConfig, isCosmos) {

	// In Cosmos, we don't need source maps or declarations.
	const compilerOptions = isCosmos ? ({
		sourceMap: true,
		declaration: false,
		declarationMap: false,
		skipLibCheck: true,
		incremental: false
	}) : undefined;


	// ts-loader is present by default in ts-webpack-builder, but here we want to change some properties.
	// So, overwrite the rules array.
	webpackConfig.module.rules = [
		{
			test: /\.tsx?$/,
			exclude: /node_modules/,
			use: [
				{
					loader: 'babel-loader',
					options: {
						presets: [['@babel/preset-env', { debug: false, targets: '> 2%, not ie <= 11' }], '@babel/preset-react'],
						// Cache won't work, since it's part of the webpack pipeline.
						cacheDirectory: false,
						cacheCompression: false
					}
				},
				{
					loader: 'ts-loader',
					options: {
						getCustomTransformers: () => ({ before: [createStyledComponentsTransformer()] }),
						onlyCompileBundledFiles: false, // Keep the default of false, or build time will double.
						transpileOnly: false, // Set to true to test speed without type-checking.
						compilerOptions: compilerOptions
					}
				}
			]
		}
	];
};