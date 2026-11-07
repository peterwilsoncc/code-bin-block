/**
 * Extends the @wordpress/scripts webpack config for microlighter.
 *
 * Microlighter loads grammars with a dynamic `import()`. By default webpack
 * would emit a chunk for each of its ~40 grammars. Instead only the grammars
 * this block uses are included and they are bundled into the main files.
 */
const webpack = require( 'webpack' );
const defaultConfig = require( '@wordpress/scripts/config/webpack.config' );

// The HTML grammar depends on CSS, JavaScript and JSON.
const GRAMMARS = /^\.\/(html|css|javascript|json)\.js$/;

const extendConfig = ( config ) => ( {
	...config,
	module: {
		...config.module,
		parser: {
			...config.module?.parser,
			javascript: {
				...config.module?.parser?.javascript,
				dynamicImportMode: 'eager',
			},
		},
	},
	plugins: [
		...config.plugins,
		new webpack.ContextReplacementPlugin( /microlighter[\\/]dist[\\/]grammars$/, GRAMMARS ),
	],
} );

module.exports = Array.isArray( defaultConfig )
	? defaultConfig.map( extendConfig )
	: extendConfig( defaultConfig );
