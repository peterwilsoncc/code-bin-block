<?php
/**
 * PHPUnit bootstrap file.
 *
 * @package CodeBinBlock
 */

$_code_bin_block_tests_directory = getenv( 'WP_TESTS_DIR' );

if ( ! $_code_bin_block_tests_directory ) {
	$_code_bin_block_tests_directory = rtrim( sys_get_temp_dir(), '/\\' ) . '/wordpress-tests-lib';
}

// Forward custom PHPUnit Polyfills configuration to PHPUnit bootstrap file.
$_code_bin_block_tests_phpunit_polyfills_directory = __DIR__ . '/../vendor/yoast/phpunit-polyfills/phpunitpolyfills-autoload.php';
if ( false !== $_code_bin_block_tests_phpunit_polyfills_directory ) {
	// phpcs:ignore WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedConstantFound -- test suite constant.
	define( 'WP_TESTS_PHPUNIT_POLYFILLS_PATH', $_code_bin_block_tests_phpunit_polyfills_directory );
}

if ( ! file_exists( "{$_code_bin_block_tests_directory}/includes/functions.php" ) ) {
	echo "Could not find {$_code_bin_block_tests_directory}/includes/functions.php, have you run bin/install-wp-tests.sh ?" . PHP_EOL; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	exit( 1 );
}

// Give access to tests_add_filter() function.
require_once "{$_code_bin_block_tests_directory}/includes/functions.php";

/**
 * Manually load the plugin being tested.
 */
function _code_bin_block_tests_manually_load_plugin() {
	require dirname( __DIR__ ) . '/code-bin-block.php';
}

tests_add_filter( 'muplugins_loaded', '_code_bin_block_tests_manually_load_plugin' );

// Start up the WP testing environment.
require "{$_code_bin_block_tests_directory}/includes/bootstrap.php";
