<?php
/**
 * Code Bin Block
 *
 * @package           CodeBinBlock
 */

namespace CodeBinBlock;

const PLUGIN_VERSION = '1.1.0';

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
	add_filter( 'embed_template', __NAMESPACE__ . '\\filter_embed_template' );
	add_filter( 'embed_html', __NAMESPACE__ . '\\filter_embed_html', 10, 2 );
	add_action( 'enqueue_block_editor_assets', __NAMESPACE__ . '\\add_editor_preview_styles' );

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

/**
 * Get the base styles for the preview.
 *
 * The styles are added to the preview document before the code bin's own CSS
 * in a cascade layer, so the code bin's CSS always takes precedence regardless
 * of specificity. They are not shown in the CSS panel.
 *
 * @return string CSS.
 */
function get_preview_styles() {
	$styles = <<<'CSS'
:root {
	color-scheme: light;
	background: #fff;
	color: #1e1e1e;
	font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif;
	font-size: 16px;
	line-height: 1.5;
}
body {
	margin: 1rem;
}
img,
video {
	max-width: 100%;
	height: auto;
}
CSS;

	/**
	 * Filters the base styles of the Code Bin preview.
	 *
	 * Use this to make previews match the site's design, eg the fonts and
	 * colors. The styles are placed in the `code-bin-base` cascade layer
	 * before the code bin's own CSS, which always takes precedence.
	 *
	 * @param string $styles CSS.
	 */
	$styles = apply_filters( 'code_bin_block_preview_styles', $styles );

	return is_string( $styles ) ? $styles : '';
}

/**
 * Wrap the preview's base styles in a style element for the preview document.
 *
 * Keep in sync with `buildPreviewDocument()` in lib/preview.js.
 *
 * @param string $styles Base styles from get_preview_styles().
 * @return string Style element, empty if there are no styles.
 */
function get_preview_styles_element( $styles ) {
	if ( '' === trim( $styles ) ) {
		return '';
	}

	// Stop the styles closing the style element early, `\/` is a valid escape in CSS.
	$styles = preg_replace( '#</(style)#i', '<\\\\/$1', $styles );

	return "<style>@layer code-bin-base{\n{$styles}\n}</style>";
}

/**
 * Pass the preview's base styles to the block editor.
 */
function add_editor_preview_styles() {
	wp_add_inline_script(
		generate_block_asset_handle( BLOCK_NAME, 'editorScript' ),
		'window.codeBinBlock = Object.assign( window.codeBinBlock || {}, ' . wp_json_encode( array( 'previewStyles' => get_preview_styles() ) ) . ' );',
		'before'
	);
}

/**
 * Use a custom oEmbed template for code bins.
 *
 * WordPress is an oEmbed provider: embedding a code bin's URL on another site
 * loads the code bin's `/embed/` URL in an iframe. The plugin's template shows
 * the Code Bin block (code and preview) only.
 *
 * Themes can provide their own `embed-code_bin.php` template to override it.
 *
 * @param string $template Path to the embed template.
 * @return string Path to the embed template.
 */
function filter_embed_template( $template ) {
	if ( ! is_singular( POST_TYPE ) ) {
		return $template;
	}

	if ( $template && str_starts_with( basename( $template ), 'embed-' . POST_TYPE ) ) {
		return $template;
	}

	return PLUGIN_DIRECTORY . '/templates/embed-code-bin.php';
}

/**
 * Make code bin embeds fill the width available on the embedding site.
 *
 * Sites embedding a WordPress post set the iframe's width to their content
 * width, or 500px if the theme doesn't define one, and WordPress limits the
 * width in the oEmbed response to 600px. Code bins need more room, so the
 * iframe's width is set to 100% instead.
 *
 * Embedding sites strip `style` attributes from the iframe but keep `width`,
 * which browsers accept as a percentage.
 *
 * Sites that have already embedded a code bin cache the HTML in post meta:
 * the change applies to them when the cache expires (a day by default).
 *
 * @param string   $output Embed HTML.
 * @param \WP_Post $post   Post being embedded.
 * @return string Embed HTML.
 */
function filter_embed_html( $output, $post ) {
	if ( POST_TYPE !== get_post_type( $post ) ) {
		return $output;
	}

	return preg_replace( '/(<iframe\b[^>]*?\swidth=")\d+(")/i', '${1}100%${2}', $output, 1 );
}

/**
 * Whether a Code Bin block has an anchor saved in its attributes.
 *
 * The editor gives each block a random anchor (WordPress 7.0+). Block support
 * outputs it as the block's ID.
 *
 * @param array $attributes Block attributes.
 * @return bool Whether the block has a saved anchor.
 */
function has_saved_anchor( $attributes ) {
	return isset( $attributes['anchor'] ) && is_string( $attributes['anchor'] ) && '' !== $attributes['anchor'];
}

/**
 * Get the anchor (HTML ID) for a Code Bin block.
 *
 * Feeds link to the block using this anchor, so it must be the same when the
 * post is rendered in a feed and on the site.
 *
 * Blocks saved without an anchor (eg before the editor generated them, on
 * WordPress before 7.0, or created outside the editor) fall back to an anchor
 * based on the block's code: changing the code changes that anchor.
 *
 * @param array $attributes Block attributes.
 * @return string Anchor.
 */
function get_block_anchor( $attributes ) {
	if ( has_saved_anchor( $attributes ) ) {
		return $attributes['anchor'];
	}

	$code = array();
	foreach ( array( 'html', 'css', 'javascript' ) as $panel ) {
		$code[ $panel ] = isset( $attributes[ $panel ] ) ? (string) $attributes[ $panel ] : '';
	}

	return 'code-bin-' . substr( md5( wp_json_encode( $code ) ), 0, 8 );
}

/**
 * Reserve an anchor for use on the current page.
 *
 * Used for anchors based on the block's code: blocks with identical code share
 * an anchor and posts can be rendered more than once per page, so only the
 * first block to use an anchor gets it. This avoids duplicate IDs on the page.
 *
 * @param string $anchor Anchor.
 * @return bool Whether the anchor was available.
 */
function reserve_block_anchor( $anchor ) {
	static $used = array();

	if ( isset( $used[ $anchor ] ) ) {
		return false;
	}

	$used[ $anchor ] = true;
	return true;
}
