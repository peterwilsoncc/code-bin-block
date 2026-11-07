<?php
/**
 * Embed template for code bins, used for oEmbed.
 *
 * Displays the Code Bin block (the code and the preview) without the title,
 * excerpt, site title or share dialog of the default embed template.
 *
 * The core embed header and footer are kept: they include the script that
 * reports the embed's height to the embedding site.
 *
 * Themes can override this with an `embed-code_bin.php` template.
 *
 * @package CodeBinBlock
 *
 * phpcs:disable WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedVariableFound -- Templates are included within a function.
 */

namespace CodeBinBlock;

if ( ! have_posts() ) {
	get_header( 'embed' );
	get_template_part( 'embed', '404' );
	get_footer( 'embed' );
	return;
}

the_post();

// Keep the default embed for password protected code bins so the code isn't exposed.
if ( post_password_required() ) {
	get_header( 'embed' );
	get_template_part( 'embed', 'content' );
	get_footer( 'embed' );
	return;
}

/*
 * Render the blocks before the header so the block's styles and scripts are
 * enqueued in time to be printed.
 */
$code_bin_content = '';
foreach ( parse_blocks( get_post()->post_content ) as $code_bin_block ) {
	if ( BLOCK_NAME === $code_bin_block['blockName'] ) {
		$code_bin_content .= render_block( $code_bin_block );
	}
}

// The share dialog is not shown.
remove_action( 'embed_footer', 'print_embed_sharing_dialog' );

add_action(
	'embed_head',
	function () {
		?>
		<style>
			html, body.code-bin-embed {
				margin: 0;
				padding: 0;
				background: transparent;
			}
			/*
			 * WordPress sites embedding this page limit the iframe's height to
			 * 1000px (see wp-includes/js/wp-embed.js) and the iframe can't scroll.
			 * Keep everything within that height: the output (Result & Console)
			 * shrinks to fit and scrolls, the code panel is already capped.
			 */
			body.code-bin-embed .code-bin-embed__content {
				max-height: 1000px;
				overflow: auto;
			}
			body.code-bin-embed .wp-block-code-bin-block-code-bin-block {
				display: flex;
				flex-direction: column;
				box-sizing: border-box;
				max-height: 1000px;
				margin: 0;
			}
			body.code-bin-embed .wp-block-code-bin-block-code-bin-block + .wp-block-code-bin-block-code-bin-block {
				margin-top: 1rem;
			}
			body.code-bin-embed .wp-block-code-bin-block-code-bin-block > *,
			body.code-bin-embed .code-bin__result > * {
				flex: none;
			}
			body.code-bin-embed .wp-block-code-bin-block-code-bin-block > .code-bin__result {
				display: flex;
				flex-direction: column;
				flex: 1 1 auto;
				min-height: 0;
			}
			body.code-bin-embed .code-bin__result > .code-bin__output {
				flex: 1 1 auto;
				min-height: 0;
				overflow: auto;
			}
		</style>
		<?php
	},
	30
);

add_filter(
	'body_class',
	function ( $classes ) {
		$classes[] = 'code-bin-embed';
		return $classes;
	}
);

/*
 * The core embed script reports the height to the embedding site on load and
 * window resize only. The block changes height when switching tabs, editing
 * code or showing errors, so trigger its resize handler when the body resizes.
 */
add_action(
	'embed_footer',
	function () {
		wp_print_inline_script_tag(
			'if ( window.ResizeObserver && window.self !== window.top ) {' .
				'new ResizeObserver( function () { window.dispatchEvent( new Event( "resize" ) ); } ).observe( document.body );' .
			'}'
		);
	},
	30
);

get_header( 'embed' );

?>
<div class="code-bin-embed__content">
	<?php echo $code_bin_content; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Rendered blocks. ?>
</div>
<?php

get_footer( 'embed' );
