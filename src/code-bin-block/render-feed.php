<?php
/**
 * Renders the `code-bin-block/code-bin-block` block in feeds.
 *
 * Feed readers strip scripts and most markup, so the live preview can't be
 * shown. Instead each panel containing code is output as its own `<pre><code>`
 * block, followed by a link to the live preview on the site.
 *
 * Included by render.php, which sets up the variables:
 *
 * @var array  $panels Panel name => label.
 * @var array  $code   Panel name => code.
 * @var string $anchor HTML ID of the block on the site.
 *
 * @package CodeBinBlock
 *
 * phpcs:disable WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedVariableFound
 */

defined( 'ABSPATH' ) || exit;

foreach ( $panels as $panel => $label ) {
	if ( '' === trim( $code[ $panel ] ) ) {
		continue;
	}

	printf(
		'<p><strong>%1$s</strong></p><pre><code class="language-%2$s">%3$s</code></pre>',
		esc_html( $label ),
		esc_attr( $panel ),
		esc_html( $code[ $panel ] )
	);
}

printf(
	'<p><a href="%s">%s</a></p>',
	esc_url( get_permalink() . '#' . $anchor ),
	esc_html__( 'View the live preview on the website.', 'code-bin-block' )
);
