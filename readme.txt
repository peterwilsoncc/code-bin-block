=== Code Bin Block ===
Contributors: peterwilsoncc
Tags:
Tested up to: 7.2
Stable tag: 1.0.0
License: MIT
License URI: https://github.com/peterwilsoncc/code-bin-block/blob/main/LICENSE

Short Description

== Description ==


== Frequently Asked Questions ==

= Can I change the default styles of the preview? =

Yes. The preview has a few base styles (font, colors, margins) that are not shown in the CSS panel. Use the `code_bin_block_preview_styles` filter to change them, for example to match your theme:

`
add_filter(
	'code_bin_block_preview_styles',
	function ( $styles ) {
		return $styles . ':root { font-family: Georgia, serif; color: #333; }';
	}
);
`

The base styles are placed in a cascade layer before the code bin's CSS, so CSS written in a code bin always takes precedence over them.

== Changelog ==
