/**
 * Console output for the preview.
 */

/** @typedef {import('./preview').ConsoleEntry} ConsoleEntry */

// Oldest entries are dropped beyond this, eg when code logs in a fast interval.
export const MAX_CONSOLE_ENTRIES = 500;

/**
 * Render console entries into an element.
 *
 * @param {HTMLElement}      container Console element.
 * @param {HTMLElement|null} counter   Element showing the number of entries.
 * @return {{add: (entry: ConsoleEntry) => void, clear: () => void}} Console view.
 */
export function createConsoleView( container, counter ) {
	const doc = container.ownerDocument;

	const updateCount = () => {
		if ( ! counter ) {
			return;
		}
		const count = container.childElementCount;
		counter.textContent = count ? String( count ) : '';
		counter.hidden = ! count;
		counter.classList.toggle(
			'has-errors',
			!! container.querySelector( '.is-error' )
		);
	};

	return {
		add( { level, text } ) {
			const entry = doc.createElement( 'div' );
			entry.className = `code-bin__console-entry is-${ level }`;
			entry.textContent = text;

			// Keep the newest entry in view if the reader is already at the bottom.
			const atBottom =
				container.scrollHeight -
					container.scrollTop -
					container.clientHeight <
				8;

			container.append( entry );
			while ( container.childElementCount > MAX_CONSOLE_ENTRIES ) {
				container.firstElementChild.remove();
			}
			if ( atBottom ) {
				container.scrollTop = container.scrollHeight;
			}
			updateCount();
		},
		clear() {
			container.replaceChildren();
			updateCount();
		},
	};
}
