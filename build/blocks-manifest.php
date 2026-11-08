<?php
// This file is generated. Do not modify it manually.
return array(
	'code-bin-block' => array(
		'$schema' => 'https://schemas.wp.org/trunk/block.json',
		'apiVersion' => 3,
		'name' => 'code-bin-block/code-bin-block',
		'version' => '0.1.0',
		'title' => 'Code Bin',
		'category' => 'embed',
		'icon' => 'code',
		'description' => 'Write HTML, CSS and JavaScript and show it with a live preview, like CodePen or JS Bin.',
		'example' => array(
			'attributes' => array(
				'html' => '<button>Click me</button>',
				'css' => 'button { font-size: 1.25rem; }',
				'javascript' => 'const button = document.querySelector( \'button\' );
button.addEventListener( \'click\', () => {
	button.textContent = \'Clicked!\';
} );'
			)
		),
		'attributes' => array(
			'html' => array(
				'type' => 'string',
				'default' => ''
			),
			'css' => array(
				'type' => 'string',
				'default' => ''
			),
			'javascript' => array(
				'type' => 'string',
				'default' => ''
			),
			'editable' => array(
				'type' => 'boolean',
				'default' => true
			),
			'previewHeight' => array(
				'type' => 'number',
				'default' => 300
			)
		),
		'supports' => array(
			'html' => false,
			'align' => array(
				'wide',
				'full'
			),
			'anchor' => true
		),
		'textdomain' => 'code-bin-block',
		'editorScript' => 'file:./index.js',
		'editorStyle' => 'file:./index.css',
		'style' => 'file:./style-index.css',
		'render' => 'file:./render.php',
		'viewScript' => 'file:./view.js'
	)
);
