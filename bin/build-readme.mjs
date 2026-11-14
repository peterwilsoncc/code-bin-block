#!/usr/bin/env node
/**
 * Build the WordPress.org readme.txt from README.md.
 *
 * Usage: node bin/build-readme.mjs
 *
 * README.md is the only copy of the readme, readme.txt is generated and not
 * committed. It runs as part of `npm run build`.
 *
 * README.md is written in GitHub flavoured markdown with the readme headers
 * (Contributors, Tags, Stable tag, etc) in YAML front matter:
 *
 *     ---
 *     Contributors: peterwilsoncc
 *     Stable tag: 1.0.0
 *     ---
 *
 *     # Plugin Name
 *
 *     Short description.
 *
 *     ## Description
 *
 *     ### A question?
 *
 * Converted to the WordPress.org readme format:
 *
 * - `# Plugin Name` becomes `=== Plugin Name ===`, followed by the headers.
 * - `## Section` becomes `== Section ==`.
 * - `### Subsection` becomes `= Subsection =`.
 * - Fenced code blocks become blocks delimited by a single backtick.
 *
 * Everything else (paragraphs, lists, links, emphasis and inline code) is the
 * same in both formats and is copied unchanged.
 *
 * @see https://developer.wordpress.org/plugins/wordpress-org/how-your-readme-txt-works/
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath( new URL( '..', import.meta.url ) );
const SOURCE = `${ ROOT }README.md`;
const TARGET = `${ ROOT }readme.txt`;

/**
 * Stop the build with an error.
 *
 * @param {string} message Error message.
 */
function fail( message ) {
	process.stderr.write( `build-readme: ${ message }\n` );
	process.exit( 1 );
}

/**
 * Split the YAML front matter from the markdown.
 *
 * Only simple `Key: value` lines are supported, which is all the readme
 * headers need. They're copied to readme.txt as is.
 *
 * @param {string} markdown README.md contents.
 * @return {{headers: string[], body: string}} Header lines and markdown body.
 */
function splitFrontMatter( markdown ) {
	const match = markdown.match( /^---\n([\s\S]*?)\n---\n/ );
	if ( ! match ) {
		fail(
			'README.md must start with front matter containing the readme headers.'
		);
	}

	const headers = match[ 1 ].split( '\n' ).filter( ( line ) => line.trim() );
	for ( const line of headers ) {
		if ( ! /^[A-Za-z][A-Za-z ]*: \S/.test( line ) ) {
			fail(
				`Unsupported front matter line, use "Header: value": ${ line }`
			);
		}
	}

	return { headers, body: markdown.slice( match[ 0 ].length ) };
}

/**
 * Convert the markdown body to the WordPress.org readme format.
 *
 * @param {string} body Markdown without the front matter.
 * @return {{title: string, lines: string[]}} Plugin name and converted lines.
 */
function convertBody( body ) {
	const lines = body.split( '\n' );
	let title = null;
	let fence = null;
	const output = [];

	for ( const line of lines ) {
		// Code blocks are copied unchanged, eg `# comment` is not a heading.
		if ( fence ) {
			if ( line.trim() === fence ) {
				fence = null;
				output.push( '`' );
			} else {
				output.push( line );
			}
			continue;
		}

		const fenceMatch = line.match( /^\s*(```|~~~)/ );
		if ( fenceMatch ) {
			fence = fenceMatch[ 1 ];
			output.push( '`' );
			continue;
		}

		const heading = line.match( /^(#{1,6})\s+(.*?)\s*#*\s*$/ );
		if ( ! heading ) {
			output.push( line );
			continue;
		}

		const [ , hashes, text ] = heading;
		if ( hashes.length === 1 ) {
			if ( title !== null ) {
				fail(
					`Only the plugin name can be a level 1 heading: ${ line }`
				);
			}
			title = text;
		} else if ( hashes.length === 2 ) {
			output.push( `== ${ text } ==` );
		} else if ( hashes.length === 3 ) {
			output.push( `= ${ text } =` );
		} else {
			fail(
				`WordPress.org readmes support headings to level 3 only: ${ line }`
			);
		}
	}

	if ( fence ) {
		fail( 'Unclosed code block.' );
	}
	if ( title === null ) {
		fail( 'README.md must have a level 1 heading with the plugin name.' );
	}

	return { title, lines: output };
}

const markdown = readFileSync( SOURCE, 'utf8' ).replace( /\r\n?/g, '\n' );
const { headers, body } = splitFrontMatter( markdown );
const { title, lines } = convertBody( body );

// The short description is the first paragraph after the plugin name.
const content = lines.join( '\n' ).trim();
if ( ! content || /^=/.test( content ) ) {
	fail( 'The plugin name must be followed by a short description.' );
}

const readme = [ `=== ${ title } ===`, ...headers, '', content, '' ]
	.join( '\n' )
	.replace( /\n{3,}/g, '\n\n' );

writeFileSync( TARGET, readme );
process.stdout.write( 'build-readme: readme.txt built from README.md.\n' );
