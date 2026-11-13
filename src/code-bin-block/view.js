/**
 * Front end behaviour for the Code Bin block.
 *
 * - Highlights the code panels.
 * - Runs the preview with loop protection and error reporting once the block
 *   is near the viewport.
 * - When the block allows it, lets visitors edit the code and see their
 *   changes live. Changes are not saved; "Reset" restores the original code.
 */
import { __ } from '@wordpress/i18n';

import { createConsoleView } from './lib/console';
import { scheduleHighlight } from './lib/highlight';
import { createPreview, describeStatus } from './lib/preview';

/** @typedef {import('./lib/preview').Code} Code */

const PANEL_NAMES = [ 'html', 'css', 'javascript' ];

/**
 * Read the code from each panel.
 *
 * @param {Map<string, () => string>} readers Panel name => function returning the panel's code.
 * @return {Code} Code panels.
 */
function readCode( readers ) {
	return Object.fromEntries(
		PANEL_NAMES.map( ( name ) => [ name, readers.get( name )?.() ?? '' ] )
	);
}

/**
 * Make a panel editable by layering a textarea over the highlighted code.
 *
 * @param {HTMLElement} panel    Panel element.
 * @param {() => void}  onChange Called after the code changes.
 * @return {{read: () => string, reset: () => void}} Panel controls.
 */
function makeEditable( panel, onChange ) {
	const editor = panel.querySelector( '.code-bin__editor' );
	const pre = editor.querySelector( '.code-bin__code' );
	const code = pre.querySelector( 'code' );
	const original = code.textContent;
	const label = panel.dataset.label || '';

	const textarea = document.createElement( 'textarea' );
	textarea.className = 'code-bin__input';
	textarea.value = original;
	textarea.spellcheck = false;
	textarea.setAttribute( 'autocapitalize', 'off' );
	textarea.setAttribute( 'autocomplete', 'off' );
	textarea.setAttribute( 'autocorrect', 'off' );
	textarea.setAttribute( 'aria-label', label );
	textarea.placeholder = code.dataset.empty || '';

	// The textarea is now the accessible copy of the code.
	pre.setAttribute( 'aria-hidden', 'true' );
	editor.append( textarea );

	/*
	 * Microlighter requires the code to be a single text node.
	 *
	 * The text node is created once and its contents are updated in place.
	 * Replacing the node on each edit, eg by setting `code.textContent`, is
	 * seen by the WordPress emoji script as new content: it replaces any emoji
	 * in the code with images, which prevents highlighting and misaligns the
	 * code and the textarea. The script ignores changes to existing text.
	 */
	let text = code.firstChild;
	if ( ! text || text.nodeType !== text.TEXT_NODE || text.nextSibling ) {
		text = document.createTextNode( '' );
		code.replaceChildren( text );
	}

	const sync = () => {
		// The new line matches the textarea's height when the code ends in a new line.
		text.data = textarea.value + '\n';
		scheduleHighlight( document );
	};
	sync();

	textarea.addEventListener( 'input', () => {
		sync();
		onChange();
	} );

	return {
		read: () => textarea.value,
		reset() {
			textarea.value = original;
			sync();
		},
	};
}

/**
 * Make a tab list switchable.
 *
 * Follows the ARIA tabs pattern with automatic activation: arrow keys, Home
 * and End move between tabs.
 *
 * @see https://www.w3.org/WAI/ARIA/apg/patterns/tabs/
 *
 * @param {HTMLElement} tablist Element with the tablist role.
 */
function initTabs( tablist ) {
	const tabs = [ ...tablist.querySelectorAll( '[role="tab"]' ) ];
	const doc = tablist.ownerDocument;

	const select = ( selected ) => {
		for ( const tab of tabs ) {
			const isSelected = tab === selected;
			tab.setAttribute( 'aria-selected', isSelected ? 'true' : 'false' );
			tab.tabIndex = isSelected ? 0 : -1;
			const panel = doc.getElementById(
				tab.getAttribute( 'aria-controls' )
			);
			if ( panel ) {
				panel.hidden = ! isSelected;
			}
		}
	};

	tabs.forEach( ( tab, index ) => {
		tab.addEventListener( 'click', () => select( tab ) );
		tab.addEventListener( 'keydown', ( event ) => {
			const targets = {
				ArrowLeft: tabs[ ( index - 1 + tabs.length ) % tabs.length ],
				ArrowRight: tabs[ ( index + 1 ) % tabs.length ],
				Home: tabs[ 0 ],
				End: tabs[ tabs.length - 1 ],
			};
			const target = targets[ event.key ];
			if ( target ) {
				event.preventDefault();
				select( target );
				target.focus();
			}
		} );
	} );
}

/**
 * Create a toolbar button.
 *
 * @param {string}     text    Button text.
 * @param {() => void} onClick Click handler.
 * @return {HTMLButtonElement} Button.
 */
function createButton( text, onClick ) {
	const button = document.createElement( 'button' );
	button.type = 'button';
	button.className = 'code-bin__button';
	button.textContent = text;
	button.addEventListener( 'click', onClick );
	return button;
}

/**
 * Initialise a code bin block.
 *
 * @param {HTMLElement} block Block wrapper.
 */
function initBlock( block ) {
	const iframe = block.querySelector( '.code-bin__preview' );
	if ( ! iframe ) {
		return;
	}

	const status = block.querySelector( '.code-bin__status' );
	const toolbar = block.querySelector( '.code-bin__toolbar' );
	const panels = [ ...block.querySelectorAll( '.code-bin__panel' ) ];
	const editable = block.dataset.codeBinEditable === 'true';
	const readers = new Map();
	const resetters = [];

	block.querySelectorAll( '[role="tablist"]' ).forEach( initTabs );

	const consoleView = createConsoleView(
		block.querySelector( '.code-bin__console' ),
		block.querySelector( '.code-bin__count' )
	);

	const preview = createPreview( iframe, {
		onStatus( next ) {
			const message = describeStatus( next );
			status.textContent = message;
			status.hidden = ! message;
			status.className = `code-bin__status is-${ next.state }`;
		},
		onConsole: consoleView.add,
		onClear: consoleView.clear,
		baseStyles: block.dataset.codeBinPreviewStyles || '',
	} );

	const onChange = () => preview.update( readCode( readers ) );

	for ( const panel of panels ) {
		const name = panel.dataset.panel;
		if ( editable ) {
			const controls = makeEditable( panel, onChange );
			readers.set( name, controls.read );
			resetters.push( controls.reset );
		} else {
			const code = panel.querySelector( '.code-bin__code > code' );
			readers.set( name, () => code.textContent );
		}
	}

	if ( toolbar ) {
		toolbar.append(
			createButton( __( 'Run', 'code-bin' ), () =>
				preview.run( readCode( readers ) )
			)
		);
		if ( editable ) {
			toolbar.append(
				createButton( __( 'Reset', 'code-bin' ), () => {
					resetters.forEach( ( reset ) => reset() );
					preview.run( readCode( readers ) );
				} )
			);
		}
	}

	// Only run previews as they approach the viewport.
	if ( 'IntersectionObserver' in window ) {
		const observer = new window.IntersectionObserver(
			( entries ) => {
				if ( entries.some( ( entry ) => entry.isIntersecting ) ) {
					observer.disconnect();
					preview.run( readCode( readers ) );
				}
			},
			{ rootMargin: '200px' }
		);
		observer.observe( block );
	} else {
		preview.run( readCode( readers ) );
	}
}

function init() {
	document
		.querySelectorAll( '.wp-block-code-bin-block-code-bin-block' )
		.forEach( initBlock );
	scheduleHighlight( document );
}

if ( document.readyState === 'loading' ) {
	document.addEventListener( 'DOMContentLoaded', init );
} else {
	init();
}
