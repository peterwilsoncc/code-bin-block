/**
 * Live preview runner shared by the editor and the front end.
 *
 * Builds an iframe `srcdoc` from the HTML, CSS and JavaScript panels and runs
 * it in a sandboxed iframe (`allow-scripts` only: no same origin access, no
 * modals, no popups, no top navigation).
 *
 * Fatal error protection:
 * - JavaScript that does not parse is never run (the last good preview stays).
 * - Loops are guarded (see loop-protect.js) and break after LOOP_TIMEOUT ms of
 *   synchronous looping. Once tripped, every loop in the document breaks and
 *   the preview document is hidden so anything the loop created (eg millions
 *   of elements) is never laid out.
 * - Console output is batched and capped at MAX_CONSOLE_ENTRIES per batch so
 *   a loop that logs on every iteration can not flood and freeze the parent.
 * - Uncaught errors and unhandled rejections are reported to the parent with
 *   postMessage.
 *
 * When a loop or runtime error is reported, live updates pause until `run()`
 * is called explicitly (eg the author clicks "Run").
 */
import { __, _n, sprintf } from '@wordpress/i18n';

import { MAX_CONSOLE_ENTRIES } from './console';
import { GUARD_NAME, protectLoops } from './loop-protect';

const LOOP_TIMEOUT = 1000;
const MESSAGE_KEY = 'codeBinPreview';
const PANEL_LABELS = {
	html: 'HTML',
	css: 'CSS',
	javascript: 'JavaScript',
};

let instanceCount = 0;

/**
 * Code from each panel.
 *
 * @typedef {Object} Code
 * @property {string} html       HTML.
 * @property {string} css        CSS.
 * @property {string} javascript JavaScript.
 */

/**
 * Preview status.
 *
 * @typedef {Object} PreviewStatus
 * @property {'ok'|'syntax'|'loop'|'error'} state     Status.
 * @property {string}                       [message] Error message.
 * @property {string|null}                  [panel]   Panel the error came from: html or javascript.
 * @property {number|null}                  [line]    Line number within the panel.
 */

/**
 * Console entry.
 *
 * @typedef {Object} ConsoleEntry
 * @property {string} level Console method: log, info, warn, error or debug.
 * @property {string} text  Message.
 */

/**
 * Preview runner returned by `createPreview()`.
 *
 * @typedef {Object} PreviewRunner
 * @property {(code?: Code) => boolean} run      Run now, resuming live updates. Returns whether the preview updated.
 * @property {(code: Code) => void}     update   Debounced live update, ignored while paused.
 * @property {() => boolean}            isPaused Whether live updates are paused.
 * @property {() => void}               destroy  Remove event listeners.
 */

/**
 * Runtime injected at the top of the preview document.
 *
 * Written as a string so the build tools can not add helpers or imports to it.
 * `__CONFIG__` is replaced with a JSON object.
 */
const RUNTIME = `(function(config){
	var started = 0, tripped = false;
	var queue = [], dropped = 0, logged = 0, flushTimer = null, max = config.maxEntries;
	function post(data){
		data.${ MESSAGE_KEY } = config.channel;
		try { parent.postMessage(data, '*'); } catch (e) {}
	}
	function flush(){
		clearTimeout(flushTimer);
		flushTimer = null;
		logged = 0;
		if (!queue.length) { return; }
		trim(max);
		// Leave room in the parent's console for the "not shown" notice and
		// the loop or error notice that usually follows.
		if (dropped) { trim(max - 2); }
		post({ type: 'console', entries: queue, dropped: dropped });
		queue = [];
		dropped = 0;
	}
	function trim(size){
		if (queue.length > size) {
			dropped += queue.length - size;
			queue = queue.slice(-size);
		}
	}
	function send(data){
		// Console output comes first so it appears before the error or loop notice.
		flush();
		post(data);
	}
	// Console output is batched: a loop that logs on every iteration would
	// otherwise flood the parent with messages and freeze the page.
	function log(level, text){
		queue.push({ level: level, text: text });
		if (queue.length > max * 2) { trim(max); }
		if (!flushTimer) { flushTimer = setTimeout(flush, 0); }
	}
	function locate(lineno){
		for (var i = 0; i < config.ranges.length; i++) {
			var range = config.ranges[i];
			if (lineno >= range.start && lineno <= range.end) {
				return { panel: range.panel, line: lineno - range.start + 1 };
			}
		}
		return { panel: null, line: null };
	}
	window.${ GUARD_NAME } = function(line, panel){
		if (tripped) { return true; }
		var now = Date.now();
		if (!started) {
			started = now;
			setTimeout(function(){ started = 0; }, 0);
		}
		if (now - started > config.timeout) {
			tripped = true;
			// Hide the document before the browser renders again: a loop adding
			// elements creates millions of them and laying them out freezes the page.
			try { document.documentElement.style.setProperty('display', 'none', 'important'); } catch (e) {}
			send({ type: 'loop', panel: panel, line: line });
			return true;
		}
		return false;
	};
	function describe(value, depth, seen){
		var type = typeof value;
		if (value === null) { return 'null'; }
		if (type === 'undefined') { return 'undefined'; }
		if (type === 'string') { return depth ? JSON.stringify(value) : value; }
		if (type === 'bigint') { return String(value) + 'n'; }
		if (type === 'number' || type === 'boolean' || type === 'symbol') { return String(value); }
		if (type === 'function') { return '\u0192 ' + (value.name || 'anonymous') + '()'; }
		try {
			if (value instanceof Error) { return value.name + ': ' + value.message; }
			if (value instanceof Date) { return value.toISOString(); }
			if (value instanceof RegExp) { return String(value); }
			if (typeof Node !== 'undefined' && value instanceof Node) {
				if (value.nodeType !== 1) { return value.nodeName; }
				return '<' + value.tagName.toLowerCase() + (value.id ? '#' + value.id : '') + (value.classList.length ? '.' + [].join.call(value.classList, '.') : '') + '>';
			}
			if (seen.indexOf(value) !== -1) { return '[Circular]'; }
			var isArray = Array.isArray(value);
			if (depth > 2) { return isArray ? '[\u2026]' : '{\u2026}'; }
			seen = seen.concat([value]);
			var items = [], limit = 100;
			if (isArray) {
				for (var i = 0; i < value.length && i < limit; i++) { items.push(describe(value[i], depth + 1, seen)); }
				if (value.length > limit) { items.push('\u2026'); }
				return '[' + items.join(', ') + ']';
			}
			if (value instanceof Map || value instanceof Set) {
				var isMap = value instanceof Map;
				value.forEach(function(entry, key){
					if (items.length < limit) { items.push(isMap ? describe(key, depth + 1, seen) + ' => ' + describe(entry, depth + 1, seen) : describe(entry, depth + 1, seen)); }
				});
				return (isMap ? 'Map' : 'Set') + '(' + value.size + ') {' + items.join(', ') + '}';
			}
			var keys = Object.keys(value), name = value.constructor && value.constructor !== Object ? value.constructor.name + ' ' : '';
			for (var k = 0; k < keys.length && k < limit; k++) { items.push(keys[k] + ': ' + describe(value[keys[k]], depth + 1, seen)); }
			if (keys.length > limit) { items.push('\u2026'); }
			return name + '{' + items.join(', ') + '}';
		} catch (e) {
			return Object.prototype.toString.call(value);
		}
	}
	['log', 'info', 'warn', 'error', 'debug'].forEach(function(level){
		var original = console[level];
		console[level] = function(){
			var parts = [];
			for (var i = 0; i < arguments.length; i++) { parts.push(describe(arguments[i], 0, [])); }
			log(level, parts.join(' '));
			// A loop logging thousands of messages can hang the browser's own dev tools.
			if (original && ++logged <= max) { return original.apply(console, arguments); }
		};
	});
	console.clear = function(){ queue = []; dropped = 0; send({ type: 'console-clear' }); };
	window.addEventListener('error', function(event){
		var where = locate(event.lineno);
		send({ type: 'error', message: String(event.message), panel: where.panel, line: where.line });
	});
	window.addEventListener('unhandledrejection', function(event){
		var reason = event.reason;
		send({ type: 'error', message: 'Uncaught (in promise) ' + String(reason && reason.message ? reason.message : reason), panel: null, line: null });
	});
})(__CONFIG__);`;

/**
 * Escape a closing tag so content can be placed inside <script> or <style>.
 *
 * `<\/script` is equivalent to `</script` in JS strings, regular expressions
 * and template literals, and `\/` is a valid escape in CSS.
 *
 * @param {string} code    Code.
 * @param {string} tagName Element the code will be placed inside.
 * @return {string} Escaped code.
 */
function escapeClosingTag( code, tagName ) {
	return code
		.replace( new RegExp( `</(${ tagName })`, 'gi' ), '<\\/$1' )
		.replace( /<!--/g, '<\\!--' );
}

/**
 * Count the lines in a string.
 *
 * @param {string} text Text.
 * @return {number} Number of new line characters.
 */
function countNewLines( text ) {
	return ( text.match( /\n/g ) || [] ).length;
}

/**
 * Add loop protection to inline <script> elements in the HTML panel.
 *
 * @param {string}   html     HTML panel.
 * @param {Document} document Document used to parse the HTML (parsing in a template is inert).
 * @return {string} Protected HTML.
 * @throws {SyntaxError} If an inline script does not parse.
 */
function protectInlineScripts( html, document ) {
	if ( ! /<script/i.test( html ) ) {
		return html;
	}

	const template = document.createElement( 'template' );
	template.innerHTML = html;

	const scripts = [ ...template.content.querySelectorAll( 'script' ) ].filter(
		( script ) =>
			! script.src &&
			[
				'',
				'module',
				'text/javascript',
				'application/javascript',
			].includes( script.type.trim().toLowerCase() )
	);

	if ( ! scripts.length ) {
		// Return the original so the author's markup is untouched.
		return html;
	}

	for ( const script of scripts ) {
		script.textContent = protectLoops( script.textContent, 'html' ).code;
	}

	return template.innerHTML;
}

/**
 * Build the preview document.
 *
 * @param {Code}     code     Code panels.
 * @param {string}   channel  Message channel identifier.
 * @param {Document} document Document used to parse HTML.
 * @return {string} Document for the iframe's srcdoc attribute.
 * @throws {SyntaxError} If any JavaScript does not parse. `error.panel` holds the panel name.
 */
export function buildPreviewDocument(
	{ html = '', css = '', javascript = '' },
	channel,
	document = window.document
) {
	let protectedHtml;
	let script = null;

	try {
		protectedHtml = protectInlineScripts( html, document );
	} catch ( error ) {
		error.panel = 'html';
		throw error;
	}

	if ( javascript.trim() ) {
		try {
			script = protectLoops( javascript, 'javascript' );
		} catch ( error ) {
			error.panel = 'javascript';
			throw error;
		}
	}

	const head =
		'<!DOCTYPE html><html><head><meta charset="utf-8">' +
		'<meta name="viewport" content="width=device-width, initial-scale=1">' +
		'<meta name="color-scheme" content="light">' +
		'<style>:root{color-scheme:light;background:#fff;color:#000}</style>' +
		'<script>' +
		RUNTIME +
		'</script>' +
		( css
			? `<style>\n${ escapeClosingTag( css, 'style' ) }\n</style>`
			: '' ) +
		'</head><body>\n';

	const htmlStart = countNewLines( head ) + 1;
	const body = protectedHtml + '\n';
	const scriptOpen = script
		? `<script${ script.sourceType === 'module' ? ' type="module"' : '' }>\n`
		: '';
	const javascriptStart = htmlStart + countNewLines( body + scriptOpen );

	const ranges = [];
	if ( html ) {
		ranges.push( {
			panel: 'html',
			start: htmlStart,
			end: htmlStart + countNewLines( html ),
		} );
	}
	if ( script ) {
		ranges.push( {
			panel: 'javascript',
			start: javascriptStart,
			end: javascriptStart + countNewLines( script.code ),
		} );
	}

	const config = JSON.stringify( {
		channel,
		ranges,
		timeout: LOOP_TIMEOUT,
		maxEntries: MAX_CONSOLE_ENTRIES,
	} ).replace( /</g, '\\u003c' );

	return (
		head.replace( '__CONFIG__', config ) +
		body +
		( script
			? scriptOpen +
				escapeClosingTag( script.code, 'script' ) +
				'\n</script>'
			: '' ) +
		'</body></html>'
	);
}

/**
 * Where an error happened, eg "JavaScript line 3".
 *
 * @param {PreviewStatus} status Status passed to `onStatus`.
 * @return {string} Location, empty if unknown.
 */
function describeLocation( status ) {
	const panel = PANEL_LABELS[ status.panel ] || '';

	if ( panel && status.line ) {
		return sprintf(
			/* translators: 1: Panel name, eg JavaScript. 2: Line number. */
			__( '%1$s line %2$d', 'code-bin-block' ),
			panel,
			status.line
		);
	}

	return panel;
}

/**
 * Console entry for an uncaught error or a stopped loop.
 *
 * @param {PreviewStatus} status Status passed to `onStatus`.
 * @return {ConsoleEntry} Console entry.
 */
function consoleEntryForStatus( status ) {
	const where = describeLocation( status );
	const text =
		status.state === 'loop'
			? __(
					'Possible infinite loop, the loop was stopped.',
					'code-bin-block'
				)
			: status.message;

	return {
		level: 'error',
		text: where ? `${ text } (${ where })` : text,
	};
}

/**
 * Human readable description of a preview status.
 *
 * @param {PreviewStatus} status Status passed to `onStatus`.
 * @return {string} Description, empty when the preview is running normally.
 */
export function describeStatus( status ) {
	const where = describeLocation( status );

	switch ( status.state ) {
		case 'syntax':
			return where
				? sprintf(
						/* translators: 1: Location, eg JavaScript line 3. 2: Error message. */
						__(
							'Syntax error (%1$s): %2$s. The preview has not been updated.',
							'code-bin-block'
						),
						where,
						status.message
					)
				: sprintf(
						/* translators: %s: Error message. */
						__(
							'Syntax error: %s. The preview has not been updated.',
							'code-bin-block'
						),
						status.message
					);
		case 'loop':
			return where
				? sprintf(
						/* translators: %s: Location, eg JavaScript line 3. */
						__(
							'Possible infinite loop (%s). The loop was stopped and live preview is paused.',
							'code-bin-block'
						),
						where
					)
				: __(
						'Possible infinite loop. The loop was stopped and live preview is paused.',
						'code-bin-block'
					);
		case 'error':
			return where
				? sprintf(
						/* translators: 1: Location, eg JavaScript line 3. 2: Error message. */
						__(
							'Error (%1$s): %2$s. Live preview is paused.',
							'code-bin-block'
						),
						where,
						status.message
					)
				: sprintf(
						/* translators: %s: Error message. */
						__(
							'Error: %s. Live preview is paused.',
							'code-bin-block'
						),
						status.message
					);
		default:
			return '';
	}
}

/**
 * Create a preview runner for an iframe.
 *
 * @param {HTMLIFrameElement}               iframe            Preview iframe.
 * @param {Object}                          options           Options.
 * @param {(status: PreviewStatus) => void} options.onStatus  Called when the status changes.
 * @param {(entry: ConsoleEntry) => void}   options.onConsole Called for each console message,
 *                                                            uncaught error or stopped loop.
 * @param {() => void}                      options.onClear   Called when the console should be cleared: when the
 *                                                            code is run and when it calls `console.clear()`.
 * @param {number}                          options.delay     Debounce delay for `update()` in ms.
 * @return {PreviewRunner} Runner.
 */
export function createPreview(
	iframe,
	{
		onStatus = () => {},
		onConsole = () => {},
		onClear = () => {},
		delay = 500,
	} = {}
) {
	// The iframe may live inside the block editor's iframe, so listen on its own window.
	const ownerWindow = iframe.ownerDocument.defaultView;
	const id = `code-bin-${ ++instanceCount }-${ Math.random().toString( 36 ).slice( 2 ) }`;
	let runCount = 0;
	let channel = '';
	let paused = false;
	let timer = null;
	let lastKey = null;
	let latest = null;

	const keyFor = ( code ) =>
		JSON.stringify( [ code.html, code.css, code.javascript ] );

	const onMessage = ( event ) => {
		if (
			event.source !== iframe.contentWindow ||
			! event.data ||
			event.data[ MESSAGE_KEY ] !== channel
		) {
			return;
		}

		const { type, entries, dropped, message, panel, line } = event.data;

		if ( type === 'console' ) {
			if ( ! Array.isArray( entries ) ) {
				return;
			}
			const hidden = Number( dropped ) || 0;
			if ( hidden > 0 ) {
				onConsole( {
					level: 'info',
					text: sprintf(
						/* translators: %d: Number of console messages. */
						_n(
							'%d earlier message was not shown.',
							'%d earlier messages were not shown.',
							hidden,
							'code-bin-block'
						),
						hidden
					),
				} );
			}
			for ( const entry of entries ) {
				onConsole( {
					level: String( entry?.level ),
					text: String( entry?.text ),
				} );
			}
			return;
		}

		if ( type === 'console-clear' ) {
			onClear();
			return;
		}

		if ( type !== 'loop' && type !== 'error' ) {
			return;
		}

		const status = { state: type, message, panel, line };
		paused = true;
		clearTimeout( timer );
		onStatus( status );
		onConsole( consoleEntryForStatus( status ) );
	};

	ownerWindow.addEventListener( 'message', onMessage );

	/**
	 * Run the code now, resuming live updates if they were paused.
	 *
	 * @param {Code} code Code panels.
	 * @return {boolean} Whether the preview was updated.
	 */
	const run = ( code = latest ) => {
		clearTimeout( timer );
		latest = code;
		if ( ! code ) {
			return false;
		}

		const nextChannel = `${ id }-${ ++runCount }`;
		let srcdoc;

		try {
			srcdoc = buildPreviewDocument(
				code,
				nextChannel,
				iframe.ownerDocument
			);
		} catch ( error ) {
			if ( ! ( error instanceof SyntaxError ) ) {
				throw error;
			}
			onStatus( {
				state: 'syntax',
				message: error.message.replace( /\s*\(\d+:\d+\)$/, '' ),
				panel: error.panel,
				line: error.loc?.line,
			} );
			return false;
		}

		paused = false;
		lastKey = keyFor( code );
		channel = nextChannel;
		// Server rendered previews start with scripts disabled, enable them now the code is protected.
		iframe.setAttribute( 'sandbox', 'allow-scripts' );
		onClear();
		iframe.srcdoc = srcdoc;
		onStatus( { state: 'ok' } );
		return true;
	};

	/**
	 * Debounced update for live previews. Ignored while paused.
	 *
	 * @param {Code} code Code panels.
	 */
	const update = ( code ) => {
		latest = code;
		if ( paused || keyFor( code ) === lastKey ) {
			return;
		}
		clearTimeout( timer );
		timer = setTimeout( () => run( latest ), delay );
	};

	return {
		run,
		update,
		isPaused: () => paused,
		destroy() {
			clearTimeout( timer );
			ownerWindow.removeEventListener( 'message', onMessage );
		},
	};
}
