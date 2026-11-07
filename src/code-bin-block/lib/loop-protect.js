/**
 * Loop protection for user supplied JavaScript.
 *
 * Inspired by JS Bin's loop-protect (https://github.com/jsbin/loop-protect).
 * That package is now a Babel plugin, so it would require shipping
 * `@babel/standalone` (~3MB) to the browser. Acorn does the same job: parse the
 * code, find every loop and insert a guard at the top of each loop body.
 *
 *     while ( true ) { doThing(); }
 *
 * becomes
 *
 *     while ( true ) {if(__codeBinBlockLoopGuard(1,"javascript"))break; doThing(); }
 *
 * No new lines are inserted so line numbers in error messages still match the
 * code the author wrote.
 *
 * The guard function itself lives in the preview runtime (see preview.js).
 */
import { parse } from 'acorn';
import { simple as walk } from 'acorn-walk';

export const GUARD_NAME = '__codeBinBlockLoopGuard';

const LOOP_TYPES = [
	'ForStatement',
	'ForInStatement',
	'ForOfStatement',
	'WhileStatement',
	'DoWhileStatement',
];

/**
 * Parse JavaScript, preferring a classic script and falling back to a module.
 *
 * @param {string} code Source code.
 * @return {{ast: Object, sourceType: string}} Parsed AST and the source type that worked.
 * @throws {SyntaxError} If the code is invalid as both a script and a module.
 */
function parseCode( code ) {
	const options = {
		ecmaVersion: 'latest',
		locations: true,
		allowHashBang: true,
	};

	try {
		return {
			ast: parse( code, { ...options, sourceType: 'script' } ),
			sourceType: 'script',
		};
	} catch ( scriptError ) {
		try {
			return {
				ast: parse( code, { ...options, sourceType: 'module' } ),
				sourceType: 'module',
			};
		} catch {
			// Report the error from the classic script parse: it is what most code bins expect.
			throw scriptError;
		}
	}
}

/**
 * Add infinite loop protection to JavaScript.
 *
 * @param {string} code  Source code.
 * @param {string} panel Panel the code came from, reported back when a loop trips.
 * @return {{code: string, sourceType: string}} Protected code and whether it is a script or module.
 * @throws {SyntaxError} If the code can not be parsed. `error.loc.line` holds the line number.
 */
export function protectLoops( code, panel = 'javascript' ) {
	const { ast, sourceType } = parseCode( code );
	const inserts = [];

	const visitLoop = ( node ) => {
		const { body } = node;
		const check = `if(${ GUARD_NAME }(${ node.loc.start.line },${ JSON.stringify( panel ) }))break;`;

		if ( body.type === 'BlockStatement' ) {
			inserts.push( [ body.start + 1, check ] );
			return;
		}

		// `while ( x ) y();` has no braces, add them so the guard is inside the loop.
		inserts.push( [ body.start, `{${ check }` ] );
		inserts.push( [ body.end, '}' ] );
	};

	walk(
		ast,
		Object.fromEntries( LOOP_TYPES.map( ( type ) => [ type, visitLoop ] ) )
	);

	// Insert from the end of the string back so earlier offsets remain valid.
	inserts.sort( ( a, b ) => b[ 0 ] - a[ 0 ] );

	let output = code;
	for ( const [ position, text ] of inserts ) {
		output = output.slice( 0, position ) + text + output.slice( position );
	}

	return { code: output, sourceType };
}
