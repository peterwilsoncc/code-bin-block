=== Code Bin ===
Contributors: peterwilsoncc
Tags:
Tested up to: 7.2
Stable tag: 1.2.0
License: MIT
License URI: https://github.com/peterwilsoncc/code-bin-block/blob/main/LICENSE

Short Description

== Description ==


== Frequently Asked Questions ==

= Can I change the default styles of the preview? =

Yes. The preview has a few base styles (font, colors, margins) that are not shown in the CSS panel. Use the `code_bin_preview_styles` filter to change them, for example to match your theme:

`
add_filter(
	'code_bin_preview_styles',
	function ( $styles ) {
		return $styles . ':root { font-family: Georgia, serif; color: #333; }';
	}
);
`

The base styles are placed in a cascade layer before the code bin's CSS, so CSS written in a code bin always takes precedence over them.

= Can I change the syntax highlighting colours? =

Yes. The colours of the code, the tabs, the console and the status messages are CSS custom properties that themes can set.

Block themes (and classic themes with a theme.json file) can set them in theme.json under `settings.custom.codeBin`, including in style variations. For example, a dark scheme:

`
{
	"version": 3,
	"settings": {
		"custom": {
			"codeBin": {
				"syntax": {
					"background": "#282a36",
					"foreground": "#f8f8f2",
					"comment": "#6272a4",
					"keyword": "#ff79c6",
					"operator": "#ff79c6",
					"string": "#f1fa8c",
					"constant": "#bd93f9",
					"function": "#50fa7b",
					"type": "#8be9fd",
					"variable": "#ffb86c",
					"property": "#8be9fd",
					"tag": "#ff79c6",
					"selector": "#50fa7b",
					"selection": "rgba(98, 114, 164, 0.5)"
				},
				"ui": {
					"colorScheme": "dark",
					"border": "#44475a",
					"divider": "#343746",
					"muted": "#a6accd",
					"toolbar": "#21222c",
					"accent": "#bd93f9",
					"button": "#343746",
					"buttonHover": "#44475a",
					"warningBackground": "#3b3520",
					"warningText": "#f1fa8c",
					"warningBorder": "#8a7a2c",
					"errorBackground": "#3c2229",
					"errorText": "#ff6e6e",
					"errorBorder": "#7a2a35",
					"errorAccent": "#ff5555"
				}
			}
		}
	}
}
`

Unset values keep their light defaults, so a dark scheme should set every colour.

Any theme can set the same properties in its stylesheet, on `:root`, `body` or the block (`.wp-block-code-bin-block-code-bin-block`):

`
:root {
	--wp--custom--code-bin--syntax--keyword: #d73a49;
	--wp--custom--code-bin--ui--font-family: "Fira Code", monospace;
}
`

Embeds of code bins on other sites do not load the theme's stylesheet. Colours set in theme.json apply to embeds automatically; colours set in CSS need adding to embeds too, using the `enqueue_embed_scripts` action.

Values that are not set keep their defaults, based on the GitHub light theme. The available properties are:

* Syntax (`--wp--custom--code-bin--syntax--{name}`): `background`, `foreground`, `comment`, `keyword`, `operator`, `string`, `constant`, `function`, `type`, `variable`, `property`, `tag`, `selector`, `selection`.
* Interface (`--wp--custom--code-bin--ui--{name}`): `color-scheme` (`light` or `dark`), `font-family`, `border`, `divider`, `muted`, `toolbar`, `accent`, `button`, `button-hover`, `warning-background`, `warning-text`, `warning-border`, `error-background`, `error-text`, `error-border`, `error-accent`.

In theme.json, write multi-word names in camel case, eg `colorScheme`, `buttonHover` and `errorBackground`.
The preview of the code bin's result has its own base styles, see the `code_bin_preview_styles` filter.

== Changelog ==
