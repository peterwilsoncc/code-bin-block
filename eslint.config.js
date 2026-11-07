/**
 * Extends the `@wordpress/scripts` ESLint config.
 *
 * `@wordpress/*` packages are provided by WordPress at runtime: the build
 * replaces the imports with the `wp.*` globals, so they don't need to be
 * listed in package.json. Classing them as internal modules stops
 * `import/no-extraneous-dependencies` reporting them.
 */
const defaultConfig = require( '@wordpress/scripts/config/eslint.config.cjs' );

module.exports = [
	...defaultConfig,
	{
		settings: {
			'import/internal-regex': '^@wordpress/',
		},
	},
];
