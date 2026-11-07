/**
 * Give each Code Bin block a random, unique HTML anchor.
 *
 * Feeds link to the block using its anchor (see render.php), so the anchor
 * needs to stay the same when the block is edited or moved. A random anchor
 * is set when the block is first added to the editor, and authors can change
 * it in the block's Advanced panel.
 */
import { getBlockType } from '@wordpress/blocks';
import {
	store as blockEditorStore,
	useBlockEditingMode,
} from '@wordpress/block-editor';
import { useRegistry } from '@wordpress/data';
import { useEffect } from '@wordpress/element';

/**
 * Client IDs of the blocks mounted in each editor.
 *
 * Keyed by registry as block previews (eg in the inserter) use their own.
 *
 * @type {WeakMap<Object, Set<string>>}
 */
const mountedBlocks = new WeakMap();

/**
 * Generate a random anchor.
 *
 * @return {string} Anchor, eg `code-bin-k3x9q2a7bd`.
 */
function generateAnchor() {
	const values = window.crypto.getRandomValues( new Uint32Array( 2 ) );
	const random = Array.from( values, ( value ) => value.toString( 36 ) )
		.join( '' )
		.slice( 0, 10 );

	return `code-bin-${ random }`;
}

/**
 * Set a random anchor on blocks without one, or with one already in use.
 *
 * The anchor is checked once, when the block mounts. Running again when the
 * anchor changes would replace it while the author is editing the field.
 *
 * @param {Object}                       props               Block edit props.
 * @param {string}                       props.clientId      Block client ID.
 * @param {string}                       props.name          Block name.
 * @param {string|undefined}             props.anchor        Current anchor.
 * @param {(attributes: Object) => void} props.setAttributes Attribute setter.
 */
export default function useGeneratedAnchor( {
	clientId,
	name,
	anchor,
	setAttributes,
} ) {
	const registry = useRegistry();
	const blockEditingMode = useBlockEditingMode();

	useEffect( () => {
		/*
		 * WordPress 7.0+ saves the anchor in the block's comment. Earlier
		 * versions read it from the saved HTML, which dynamic blocks don't have,
		 * so a generated anchor would be lost and regenerated on every load.
		 */
		if ( getBlockType( name )?.attributes?.anchor?.source ) {
			return;
		}

		if ( ! mountedBlocks.has( registry ) ) {
			mountedBlocks.set( registry, new Set() );
		}
		const mounted = mountedBlocks.get( registry );

		// Blocks that can't be edited, eg inside a synced pattern, are left alone.
		if ( blockEditingMode !== 'disabled' ) {
			const { getBlockAttributes } = registry.select( blockEditorStore );

			// Copies of a block share its anchor: the copy mounts later, so it gets a new one.
			const inUse =
				!! anchor &&
				[ ...mounted ].some(
					( otherClientId ) =>
						getBlockAttributes( otherClientId )?.anchor === anchor
				);

			if ( ! anchor || inUse ) {
				// Avoid an undo step: undoing would remove the anchor.
				registry
					.dispatch( blockEditorStore )
					.__unstableMarkNextChangeAsNotPersistent();
				setAttributes( { anchor: generateAnchor() } );
			}
		}

		mounted.add( clientId );
		return () => mounted.delete( clientId );
	}, [] ); // eslint-disable-line react-hooks/exhaustive-deps
}
