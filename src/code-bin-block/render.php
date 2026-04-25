<?php
/**
 * Renders the `code-bin-block/code-bin-block` block on the server.
 *
 * @package CodeBinBlock
 *
 * phpcs:disable WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedVariableFound
 */

$srcdoc = '';
$srcdoc .= '<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head><body>';
if ( ! empty( $attributes['html'] ) ) {
	$srcdoc .= $attributes['html'];
}

if ( ! empty( $attributes['css'] ) ) {
	$srcdoc .= '<style>' . $attributes['css'] . '</style>';
}

if ( ! empty( $attributes['javascript'] ) ) {
	$srcdoc .= '<script>' . $attributes['javascript'] . '</script>';
}

$srcdoc .= '</body></html>';

?>
<iframe <?php echo get_block_wrapper_attributes(); ?> srcdoc="<?php echo esc_attr( $srcdoc ); ?>" sandbox="allow-scripts">
	<?php esc_html_e( 'Code Bin – hello from a dynamic block!', 'code-bin-block' ); ?>
</iframe>
