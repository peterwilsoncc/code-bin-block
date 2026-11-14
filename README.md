---
Contributors: peterwilsoncc
Tags: code, html, css, javascript, block
Tested up to: 7.2
Stable tag: 1.3.0
License: MIT
License URI: https://github.com/peterwilsoncc/code-bin/blob/main/LICENSE
---

# Code Bin

Write HTML, CSS and JavaScript in WordPress and show it with a live preview your visitors can edit.

## Description

Code Bin adds a code playground to WordPress, similar to CodePen or JS Bin.

Write HTML, CSS and JavaScript in separate tabs and the result is shown in a live preview below the code. A console tab shows messages logged by the JavaScript, including any errors.

Code bins can be created in two ways:

* as a Code Bin post, from the Code Bins menu in the dashboard. Each post contains a single code bin and has its own URL, eg `example.com/code-bin/my-demo/`
* with the Code Bin block, in any post or page

By default, visitors can edit the code and see their changes in the preview. Their changes are not saved, the Reset button restores the original code. Editing can be turned off for each code bin.

Code bins can be embedded on other sites by pasting the code bin's URL into an Embed block, the same as embedding a YouTube video.

Infinite loops in the JavaScript are stopped before they can freeze the visitor's browser. The loop protection is inspired by [JS Bin's loop protection](https://github.com/jsbin/loop-protect).

Syntax highlighting is provided by [microlighter](https://github.com/davatron5000/microlighter), which uses the CSS Custom Highlight API.

If you find any bugs or wish to contribute a pull request, please do so via the [plugin's GitHub repository](https://github.com/peterwilsoncc/code-bin).

## Frequently Asked Questions

### Where is the settings page?

There isn't one. The settings for each code bin are in the block's sidebar in the editor:

* Allow visitors to edit the code
* Preview height

### Are visitors' changes saved?

No.

Changes made by visitors only exist in their browser. Reloading the page or pressing Reset restores the code you wrote.

### Is it safe to run JavaScript written in a code bin?

The preview runs in a sandboxed iframe that is only allowed to run scripts. The code can't access your site, its cookies or the visitor's logged in session.

The JavaScript only runs in the browser viewing the code bin. It doesn't run on your server.

### What do feed readers see?

Feed readers strip scripts, so the live preview can't be shown. Instead feeds include the code and a link to the live preview on your site.

### Can I change the default styles of the preview?

Yes.

The preview has a few base styles (font, colors, margins) that are not shown in the CSS panel. Use the `code_bin_preview_styles` filter to change them, for example to match your theme:

```php
add_filter(
	'code_bin_preview_styles',
	function ( $styles ) {
		return $styles . ':root { font-family: Georgia, serif; color: #333; }';
	}
);
```

The base styles are placed in a cascade layer before the code bin's CSS, so CSS written in a code bin always takes precedence over them.

### Can I change the syntax highlighting colors?

Yes.

The colors of the code, the tabs, the console and the status messages are CSS custom properties that themes can set.

Block themes (and classic themes with a theme.json file) can set them in theme.json under `settings.custom.codeBin`, including in style variations. For example, a dark scheme:

```json
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
```

Unset values keep their light defaults, so a dark scheme should set every color.

Any theme can set the same properties in its stylesheet, on `:root`, `body` or the block (`.wp-block-code-bin-block-code-bin-block`):

```css
:root {
	--wp--custom--code-bin--syntax--keyword: #d73a49;
	--wp--custom--code-bin--ui--font-family: "Fira Code", monospace;
}
```

Embeds of code bins on other sites do not load the theme's stylesheet. Colors set in theme.json apply to embeds automatically, colors set in CSS need adding to embeds too using the `enqueue_embed_scripts` action.

Values that are not set keep their defaults, based on the GitHub light theme. The available properties are:

* Syntax (`--wp--custom--code-bin--syntax--{name}`): `background`, `foreground`, `comment`, `keyword`, `operator`, `string`, `constant`, `function`, `type`, `variable`, `property`, `tag`, `selector`, `selection`.
* Interface (`--wp--custom--code-bin--ui--{name}`): `color-scheme` (`light` or `dark`), `font-family`, `border`, `divider`, `muted`, `toolbar`, `accent`, `button`, `button-hover`, `warning-background`, `warning-text`, `warning-border`, `error-background`, `error-text`, `error-border`, `error-accent`.

In theme.json, write multi-word names in camel case, eg `colorScheme`, `buttonHover` and `errorBackground`.

### How is this plugin licensed?

The plugin code is licensed under the [MIT License](https://github.com/peterwilsoncc/code-bin/blob/main/LICENSE).

The bundled [microlighter](https://github.com/davatron5000/microlighter), [Acorn](https://github.com/acornjs/acorn) and [acorn-walk](https://github.com/acornjs/acorn/tree/master/acorn-walk) libraries are also licensed under the MIT License.

## Changelog

### 1.3.0

* Initial stable release.
