<?php
/**
 * Code Bin Block
 *
 * @package           CodeBinBlock
 */

namespace PWCC\CodeBinBlock;

const PLUGIN_VERSION = '1.0.0';

/**
 * Bootstrap the plugin.
 */
function bootstrap() {
	add_action( 'init', __NAMESPACE__ . '\\block_init' );
}

/**
 * Registers the block(s) metadata from the `blocks-manifest.php` and registers the block type(s)
 * based on the registered block metadata. Behind the scenes, it registers also all assets so they can be enqueued
 * through the block editor in the corresponding context.
 *
 * @see https://make.wordpress.org/core/2025/03/13/more-efficient-block-type-registration-in-6-8/
 * @see https://make.wordpress.org/core/2024/10/17/new-block-type-registration-apis-to-improve-performance-in-wordpress-6-7/
 */
function block_init() {
	wp_register_block_types_from_metadata_collection( PLUGIN_DIRECTORY . '/build', PLUGIN_DIRECTORY . '/build/blocks-manifest.php' );
}
