/**
 * Syntax highlighting via microlighter (https://davatron5000.github.io/microlighter/).
 *
 * Microlighter uses the CSS Custom Highlight API. Highlights are registered on
 * `CSS.highlights` of the window the script runs in. The block editor renders
 * blocks inside an iframe, so after highlighting a document belonging to
 * another window the highlights are copied to that window's registry.
 *
 * Microlighter rebuilds every highlight it owns on each call, so always
 * highlight the whole document rather than a single block.
 */
import { highlightAll } from 'microlighter';

export const CODE_SELECTOR = '.code-bin__code > code';

const pending = new Set();
const mirroredNames = new WeakMap();

/**
 * Whether a window supports the CSS Custom Highlight API.
 *
 * @param {Window} win Window.
 * @return {boolean} Whether highlights are supported.
 */
const supportsHighlights = ( win ) =>
	!! win?.CSS?.highlights && typeof win.Highlight === 'function';

/**
 * Highlight all code bin code in a document.
 *
 * @param {Document} doc Document.
 */
async function highlightDocument( doc ) {
	const win = doc.defaultView;
	if ( ! supportsHighlights( window ) || ! supportsHighlights( win ) ) {
		return;
	}

	await highlightAll( { root: doc, selector: CODE_SELECTOR } );

	if ( win === window ) {
		return;
	}

	// Copy the highlights into the other window's registry.
	const names = mirroredNames.get( win ) || new Set();
	names.forEach( ( name ) => win.CSS.highlights.delete( name ) );
	names.clear();

	window.CSS.highlights.forEach( ( highlight, name ) => {
		win.CSS.highlights.set( name, new win.Highlight( ...highlight ) );
		names.add( name );
	} );

	mirroredNames.set( win, names );
}

/**
 * Highlight a document, batching multiple requests in the same tick.
 *
 * @param {Document} doc Document containing code bin blocks.
 */
export function scheduleHighlight( doc ) {
	if ( ! doc || pending.has( doc ) ) {
		return;
	}

	pending.add( doc );
	Promise.resolve().then( () => {
		pending.delete( doc );
		highlightDocument( doc ).catch( () => {
			// Highlighting is an enhancement, unhighlighted code is fine.
		} );
	} );
}
