/**
 * Retrieves the translation of text.
 *
 * @see https://developer.wordpress.org/block-editor/reference-guides/packages/packages-i18n/
 */
import { __ } from '@wordpress/i18n';

/**
 * React hook that is used to mark the block wrapper element.
 * It provides all the necessary props like the class name.
 *
 * @see https://developer.wordpress.org/block-editor/reference-guides/packages/packages-block-editor/#useblockprops
 */
import { RichText, useBlockProps } from '@wordpress/block-editor';

import { TabPanel } from '@wordpress/components';

/**
 * Lets webpack process CSS, SASS or SCSS files referenced in JavaScript files.
 * Those files can contain any CSS code that gets applied to the editor.
 *
 * @see https://www.npmjs.com/package/@wordpress/scripts#using-css
 */
import './editor.scss';

/**
 * The edit function describes the structure of your block in the context of the
 * editor. This represents what the editor will render when the block is used.
 *
 * @see https://developer.wordpress.org/block-editor/reference-guides/block-api/block-edit-save/#edit
 *
 * @return {Element} Element to render.
 */
export default function Edit({
	attributes,
	setAttributes,
	onRemove,
	insertBlocksAfter,
	mergeBlocks,
}) {
	return (
		<div { ...useBlockProps() }>
			<TabPanel
				className="code-bin-block-tabs"
				activeClass="code-bin-block-tabs__active-tab"
				tabs={ [
					{
						name: 'html',
						title: __( 'HTML' ),
						className: 'code-bin-block-tabs__html-tab',
					},
					{
						name: 'css',
						title: __( 'CSS' ),
						className: 'code-bin-block-tabs__css-tab',
					},
					{
						name: 'javascript',
						title: __( 'JavaScript' ),
						className: 'code-bin-block-tabs__javascript-tab',
					},
				] }
			>
				{ ( tab ) => (
					<div className={ tab.className }>
						{ tab.name === 'html' && (
							<RichText
								tagName="code"
								identifier="html"
								value={ attributes.html }
								onChange={ ( html ) => setAttributes( { html } ) }
								onRemove={ onRemove }
								onMerge={ mergeBlocks }
								placeholder={ __( 'Write html…' ) }
								aria-label={ __( 'HTML' ) }
								preserveWhiteSpace
								__unstablePastePlainText
								__unstableOnSplitAtDoubleLineEnd={ () =>
									insertBlocksAfter( createBlock( getDefaultBlockName() ) )
								}
								style={ { whiteSpace: 'break-spaces' } }
							/>
						) }
						{ tab.name === 'css' && (
							<RichText
								tagName="code"
								identifier="css"
								value={ attributes.css }
								onChange={ ( css ) => setAttributes( { css } ) }
								onRemove={ onRemove }
								onMerge={ mergeBlocks }
								placeholder={ __( 'Write css…' ) }
								aria-label={ __( 'CSS' ) }
								preserveWhiteSpace
								__unstablePastePlainText
								__unstableOnSplitAtDoubleLineEnd={ () =>
									insertBlocksAfter( createBlock( getDefaultBlockName() ) )
								}
								style={ { whiteSpace: 'break-spaces' } }
							/>
						) }
						{ tab.name === 'javascript' && (
							<RichText
								tagName="code"
								identifier="javascript"
								value={ attributes.javascript }
								onChange={ ( javascript ) => setAttributes( { javascript } ) }
								onRemove={ onRemove }
								onMerge={ mergeBlocks }
								placeholder={ __( 'Write JavaScript…' ) }
								aria-label={ __( 'JavaScript' ) }
								preserveWhiteSpace
								__unstablePastePlainText
								__unstableOnSplitAtDoubleLineEnd={ () =>
									insertBlocksAfter( createBlock( getDefaultBlockName() ) )
								}
								style={ { whiteSpace: 'break-spaces' } }
							/>
						) }
					</div>
				) }
			</TabPanel>
		</div>
	);
}
