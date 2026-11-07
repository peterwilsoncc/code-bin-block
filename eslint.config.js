/**
 * Extends the `@wordpress/scripts` ESLint config.
 *
 * `@wordpress/*` packages are provided by WordPress at runtime: the build
 * replaces the imports with the `wp.*` globals, so they don't need to be
 * listed in package.json. Classing them as internal modules stops
 * `import/no-extraneous-dependencies` reporting them.
 */
const defaultConfig = require( '@wordpress/scripts/config/eslint.config.cjs' );

/*
 * Packages WordPress provides as scripts, so they don't need to be installed.
 *
 * Mirrors `defaultRequestToExternal()` in
 * `@wordpress/dependency-extraction-webpack-plugin/lib/util.js`. Packages that
 * plugin bundles rather than externalises (eg `@wordpress/icons`) are excluded:
 * they're compiled into the build so they must be installed.
 */
const WORDPRESS_BUNDLED_PACKAGES = [
	'admin-ui',
	'dataviews',
	'fields',
	'global-styles-engine',
	'global-styles-ui',
	'grid',
	'icons',
	'interface',
	'kebab-case',
	'style-runtime',
	'ui',
	'undo-manager',
	'views',
];

const WORDPRESS_PROVIDED_PACKAGES = [
	`^@wordpress/(?!(${ WORDPRESS_BUNDLED_PACKAGES.join( '|' ) })(/|$))`,
	'^(jquery|lodash|lodash-es|moment)$',
	'^(react|react-dom|react-dom/client|react/jsx-runtime|react/jsx-dev-runtime)$',
	'^@babel/runtime/regenerator$',
	'react-refresh/runtime',
];

module.exports = [
	...defaultConfig,
	{
		settings: {
			'import/internal-regex': '^@wordpress/',
		},
		rules: {
			'import/no-unresolved': [
				'error',
				{ ignore: WORDPRESS_PROVIDED_PACKAGES },
			],
		},
	},
];
