<?php
/**
 * Renders the `code-bin-block/code-bin-block` block on the server.
 *
 * Outputs tabs containing the code as escaped text, followed by a preview
 * iframe. Every tab is shown, even when it contains no code.
 *
 * The iframe is rendered with an empty sandbox (scripts disabled) and only the
 * HTML and CSS. The view script adds loop protection to the JavaScript and
 * then re-renders the preview with scripts enabled. This prevents an infinite
 * loop locking up the page before the protection is in place, and gives
 * visitors without JavaScript a static preview.
 *
 * @package CodeBinBlock
 *
 * phpcs:disable WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedVariableFound
 */

$panels = array(
	'html'       => 'HTML',
	'css'        => 'CSS',
	'javascript' => 'JavaScript',
);

$code = array();
foreach ( $panels as $panel => $label ) {
	$code[ $panel ] = isset( $attributes[ $panel ] ) ? (string) $attributes[ $panel ] : '';
}

if ( '' === trim( implode( '', $code ) ) ) {
	return;
}

$preview_height = isset( $attributes['previewHeight'] ) ? absint( $attributes['previewHeight'] ) : 300;
$editable       = ! empty( $attributes['editable'] );

$srcdoc  = '<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">';
$srcdoc .= '<meta name="color-scheme" content="light"><style>:root{color-scheme:light;background:#fff;color:#000}</style>';
if ( '' !== trim( $code['css'] ) ) {
	$srcdoc .= '<style>' . $code['css'] . '</style>';
}
$srcdoc .= '</head><body>' . $code['html'] . '</body></html>';

// Show the first panel containing code.
$active_panel = 'html';
foreach ( $panels as $panel => $label ) {
	if ( '' !== trim( $code[ $panel ] ) ) {
		$active_panel = $panel;
		break;
	}
}

$id_prefix = wp_unique_id( 'code-bin-' );

$wrapper_attributes = get_block_wrapper_attributes(
	array(
		'class'                  => 'code-bin',
		'data-code-bin-editable' => $editable ? 'true' : 'false',
	)
);
?>
<div <?php echo $wrapper_attributes; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- escaped by core. ?>>
	<div class="code-bin__tablist" role="tablist" aria-label="<?php esc_attr_e( 'Code', 'code-bin-block' ); ?>">
		<?php foreach ( $panels as $panel => $label ) : ?>
			<button
				type="button"
				role="tab"
				class="code-bin__tab"
				id="<?php echo esc_attr( "{$id_prefix}-tab-{$panel}" ); ?>"
				aria-controls="<?php echo esc_attr( "{$id_prefix}-panel-{$panel}" ); ?>"
				aria-selected="<?php echo $panel === $active_panel ? 'true' : 'false'; ?>"
				tabindex="<?php echo $panel === $active_panel ? '0' : '-1'; ?>"
			><?php echo esc_html( $label ); ?></button>
		<?php endforeach; ?>
	</div>
	<?php foreach ( $panels as $panel => $label ) : ?>
		<div
			class="code-bin__panel"
			role="tabpanel"
			id="<?php echo esc_attr( "{$id_prefix}-panel-{$panel}" ); ?>"
			aria-labelledby="<?php echo esc_attr( "{$id_prefix}-tab-{$panel}" ); ?>"
			data-panel="<?php echo esc_attr( $panel ); ?>"
			data-label="<?php echo esc_attr( $label ); ?>"
			<?php echo $panel === $active_panel ? '' : 'hidden'; ?>
		>
			<div class="code-bin__editor">
				<?php
				/* translators: %s: Language name, eg CSS. */
				$empty_text = sprintf( __( 'No %s', 'code-bin-block' ), $label );
				?>
				<pre class="code-bin__code"><code class="language-<?php echo esc_attr( $panel ); ?>" data-empty="<?php echo esc_attr( $empty_text ); ?>"><?php echo esc_html( $code[ $panel ] ); ?></code></pre>
			</div>
		</div>
	<?php endforeach; ?>
	<div class="code-bin__result">
		<div class="code-bin__toolbar">
			<div class="code-bin__tablist" role="tablist" aria-label="<?php esc_attr_e( 'Output', 'code-bin-block' ); ?>">
				<button
					type="button"
					role="tab"
					class="code-bin__tab"
					id="<?php echo esc_attr( "{$id_prefix}-tab-result" ); ?>"
					aria-controls="<?php echo esc_attr( "{$id_prefix}-panel-result" ); ?>"
					aria-selected="true"
					tabindex="0"
				><?php esc_html_e( 'Result', 'code-bin-block' ); ?></button>
				<button
					type="button"
					role="tab"
					class="code-bin__tab"
					id="<?php echo esc_attr( "{$id_prefix}-tab-console" ); ?>"
					aria-controls="<?php echo esc_attr( "{$id_prefix}-panel-console" ); ?>"
					aria-selected="false"
					tabindex="-1"
				><?php esc_html_e( 'Console', 'code-bin-block' ); ?> <span class="code-bin__count" hidden></span></button>
			</div>
		</div>
		<div class="code-bin__status" role="status" hidden></div>
		<div
			class="code-bin__output"
			role="tabpanel"
			id="<?php echo esc_attr( "{$id_prefix}-panel-result" ); ?>"
			aria-labelledby="<?php echo esc_attr( "{$id_prefix}-tab-result" ); ?>"
		>
			<iframe
				class="code-bin__preview"
				title="<?php esc_attr_e( 'Code preview', 'code-bin-block' ); ?>"
				sandbox=""
				style="height: <?php echo esc_attr( $preview_height ); ?>px"
				srcdoc="<?php echo esc_attr( $srcdoc ); ?>"
			></iframe>
		</div>
		<div
			class="code-bin__output"
			role="tabpanel"
			id="<?php echo esc_attr( "{$id_prefix}-panel-console" ); ?>"
			aria-labelledby="<?php echo esc_attr( "{$id_prefix}-tab-console" ); ?>"
			hidden
		>
			<div
				class="code-bin__console"
				role="log"
				style="height: <?php echo esc_attr( $preview_height ); ?>px"
				data-empty="<?php esc_attr_e( 'Console messages from the JavaScript will appear here.', 'code-bin-block' ); ?>"
			></div>
		</div>
	</div>
</div>
