<?php
/**
 * Code Bin Block
 *
 * @package           CodeBinBlock
 */

namespace PWCC\CodeBinBlock;

const PLUGIN_VERSION = '1.0.0';

const POST_TYPE = 'code_bin';

const BLOCK_NAME = 'code-bin-block/code-bin-block';

/**
 * Bootstrap the plugin.
 */
function bootstrap() {
	add_action( 'init', __NAMESPACE__ . '\\block_init' );
	add_action( 'init', __NAMESPACE__ . '\\register_post_type' );
	add_filter( 'allowed_block_types_all', __NAMESPACE__ . '\\filter_allowed_block_types', 10, 2 );
	add_filter( 'block_editor_settings_all', __NAMESPACE__ . '\\filter_block_editor_settings', 10, 2 );

	register_activation_hook( PLUGIN_FILE, __NAMESPACE__ . '\\activate' );
	register_deactivation_hook( PLUGIN_FILE, 'flush_rewrite_rules' );
}

/**
 * Flush rewrite rules on activation so the post type's URLs work.
 */
function activate() {
	register_post_type();
	flush_rewrite_rules();
}

/**
 * Register the Code Bin post type.
 *
 * Each code bin contains a single Code Bin block. The template is locked so
 * the block can be edited but not moved, removed or added to.
 */
function register_post_type() {
	\register_post_type(
		POST_TYPE,
		array(
			'labels'        => array(
				'name'                     => _x( 'Code Bins', 'post type general name', 'code-bin-block' ),
				'singular_name'            => _x( 'Code Bin', 'post type singular name', 'code-bin-block' ),
				'add_new'                  => _x( 'Add New', 'code bin', 'code-bin-block' ),
				'add_new_item'             => __( 'Add New Code Bin', 'code-bin-block' ),
				'edit_item'                => __( 'Edit Code Bin', 'code-bin-block' ),
				'new_item'                 => __( 'New Code Bin', 'code-bin-block' ),
				'view_item'                => __( 'View Code Bin', 'code-bin-block' ),
				'view_items'               => __( 'View Code Bins', 'code-bin-block' ),
				'search_items'             => __( 'Search Code Bins', 'code-bin-block' ),
				'not_found'                => __( 'No code bins found.', 'code-bin-block' ),
				'not_found_in_trash'       => __( 'No code bins found in Trash.', 'code-bin-block' ),
				'all_items'                => __( 'All Code Bins', 'code-bin-block' ),
				'archives'                 => __( 'Code Bin Archives', 'code-bin-block' ),
				'attributes'               => __( 'Code Bin Attributes', 'code-bin-block' ),
				'insert_into_item'         => __( 'Insert into code bin', 'code-bin-block' ),
				'uploaded_to_this_item'    => __( 'Uploaded to this code bin', 'code-bin-block' ),
				'filter_items_list'        => __( 'Filter code bins list', 'code-bin-block' ),
				'items_list_navigation'    => __( 'Code bins list navigation', 'code-bin-block' ),
				'items_list'               => __( 'Code bins list', 'code-bin-block' ),
				'item_published'           => __( 'Code bin published.', 'code-bin-block' ),
				'item_published_privately' => __( 'Code bin published privately.', 'code-bin-block' ),
				'item_reverted_to_draft'   => __( 'Code bin reverted to draft.', 'code-bin-block' ),
				'item_scheduled'           => __( 'Code bin scheduled.', 'code-bin-block' ),
				'item_updated'             => __( 'Code bin updated.', 'code-bin-block' ),
				'item_link'                => _x( 'Code Bin Link', 'navigation link block title', 'code-bin-block' ),
				'item_link_description'    => _x( 'A link to a code bin.', 'navigation link block description', 'code-bin-block' ),
			),
			'public'        => true,
			'has_archive'   => true,
			'rewrite'       => array( 'slug' => 'code-bin' ),
			'menu_icon'     => 'dashicons-editor-code',
			'show_in_rest'  => true,
			'rest_base'     => 'code-bins',
			'supports'      => array( 'title', 'editor', 'author', 'revisions' ),
			'template'      => array(
				array( BLOCK_NAME ),
			),
			'template_lock' => 'all',
		)
	);
}

/**
 * Only allow the Code Bin block in the Code Bin post type.
 *
 * The locked template already prevents inserting blocks. This also stops
 * other blocks being offered via transforms, paste or patterns.
 *
 * @param bool|string[]            $allowed_block_types Allowed block types, true for all.
 * @param \WP_Block_Editor_Context $block_editor_context Editor context.
 * @return bool|string[] Allowed block types.
 */
function filter_allowed_block_types( $allowed_block_types, $block_editor_context ) {
	if ( empty( $block_editor_context->post ) || POST_TYPE !== $block_editor_context->post->post_type ) {
		return $allowed_block_types;
	}

	return array( BLOCK_NAME );
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

/**
 * Stop the Code Bin post type's template being worked around.
 *
 * - Block locking UI is disabled: unlocking a block overrides the template lock.
 * - The code editor is disabled: it allows any blocks to be typed in as markup.
 *
 * @param array                    $settings             Block editor settings.
 * @param \WP_Block_Editor_Context $block_editor_context Editor context.
 * @return array Block editor settings.
 */
function filter_block_editor_settings( $settings, $block_editor_context ) {
	if ( empty( $block_editor_context->post ) || POST_TYPE !== $block_editor_context->post->post_type ) {
		return $settings;
	}

	$settings['canLockBlocks']      = false;
	$settings['codeEditingEnabled'] = false;

	return $settings;
}
