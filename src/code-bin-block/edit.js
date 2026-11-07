/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { InspectorControls, useBlockProps } from '@wordpress/block-editor';
import {
	Button,
	PanelBody,
	RangeControl,
	TabPanel,
	ToggleControl,
} from '@wordpress/components';
import { useEffect, useRef, useState } from '@wordpress/element';
import { useInstanceId } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import { MAX_CONSOLE_ENTRIES } from './lib/console';
import { scheduleHighlight } from './lib/highlight';
import { createPreview, describeStatus } from './lib/preview';
import './editor.scss';

/** @typedef {import('./lib/preview').Code} Code */

const PANELS = [
	{
		name: 'html',
		title: 'HTML',
		language: 'html',
		placeholder: __( 'Write HTML…', 'code-bin-block' ),
	},
	{
		name: 'css',
		title: 'CSS',
		language: 'css',
		placeholder: __( 'Write CSS…', 'code-bin-block' ),
	},
	{
		name: 'javascript',
		title: 'JavaScript',
		language: 'javascript',
		placeholder: __( 'Write JavaScript…', 'code-bin-block' ),
	},
];

/**
 * Plain text code input with syntax highlighting.
 *
 * A transparent textarea sits on top of a highlighted <pre><code> containing
 * the same text. The markup matches the front end (see render.php & view.js).
 *
 * @param {Object}                  props             Props.
 * @param {string}                  props.language    Language for highlighting.
 * @param {string}                  props.value       Code.
 * @param {(value: string) => void} props.onChange    Change handler.
 * @param {string}                  props.label       Accessible label.
 * @param {string}                  props.placeholder Placeholder.
 * @return {Element} Code input.
 */
function CodeInput( { language, value, onChange, label, placeholder } ) {
	const codeRef = useRef();

	useEffect( () => {
		scheduleHighlight( codeRef.current?.ownerDocument );
	}, [ value, language ] );

	return (
		<div className="code-bin__editor">
			<pre className="code-bin__code" aria-hidden="true">
				{ /* A single string child keeps a single text node, which microlighter requires.
				The trailing new line matches the textarea's height when the code ends in a new line. */ }
				<code ref={ codeRef } className={ `language-${ language }` }>
					{ value + '\n' }
				</code>
			</pre>
			<textarea
				className="code-bin__input"
				value={ value }
				onChange={ ( event ) => onChange( event.target.value ) }
				aria-label={ label }
				placeholder={ placeholder }
				spellCheck={ false }
				autoCapitalize="off"
				autoComplete="off"
				autoCorrect="off"
			/>
		</div>
	);
}

const OUTPUT_TABS = [
	{ name: 'result', title: __( 'Result', 'code-bin-block' ) },
	{ name: 'console', title: __( 'Console', 'code-bin-block' ) },
];

/**
 * Live preview of the code with a tab for the JavaScript console.
 *
 * The tabs are hand rolled rather than using TabPanel, which unmounts inactive
 * tabs: the iframe must stay mounted to keep running.
 *
 * @param {Object} props        Props.
 * @param {Code}   props.code   Code panels.
 * @param {number} props.height Preview height.
 * @return {Element} Preview.
 */
function Preview( { code, height } ) {
	const iframeRef = useRef();
	const previewRef = useRef();
	const tabRefs = useRef( {} );
	const codeRef = useRef( code );
	const [ status, setStatus ] = useState( { state: 'ok' } );
	const [ entries, setEntries ] = useState( [] );
	const [ activeTab, setActiveTab ] = useState( 'result' );
	const instanceId = useInstanceId( Preview, 'code-bin-output' );

	codeRef.current = code;

	useEffect( () => {
		const preview = createPreview( iframeRef.current, {
			onStatus: setStatus,
			onConsole: ( entry ) =>
				setEntries( ( current ) =>
					[ ...current, entry ].slice( -MAX_CONSOLE_ENTRIES )
				),
			onClear: () => setEntries( [] ),
		} );
		previewRef.current = preview;
		preview.run( codeRef.current );

		return () => preview.destroy();
	}, [] );

	useEffect( () => {
		previewRef.current?.update( code );
	}, [ code.html, code.css, code.javascript ] ); // eslint-disable-line react-hooks/exhaustive-deps

	const message = describeStatus( status );
	const hasErrors = entries.some( ( entry ) => entry.level === 'error' );

	const onTabKeyDown = ( event, index ) => {
		const count = OUTPUT_TABS.length;
		const targets = {
			ArrowLeft: ( index - 1 + count ) % count,
			ArrowRight: ( index + 1 ) % count,
			Home: 0,
			End: count - 1,
		};
		if ( event.key in targets ) {
			event.preventDefault();
			const target = OUTPUT_TABS[ targets[ event.key ] ].name;
			setActiveTab( target );
			tabRefs.current[ target ]?.focus();
		}
	};

	return (
		<div className="code-bin__result">
			<div className="code-bin__toolbar">
				<div
					className="code-bin__tablist"
					role="tablist"
					aria-label={ __( 'Output', 'code-bin-block' ) }
				>
					{ OUTPUT_TABS.map( ( tab, index ) => (
						<button
							key={ tab.name }
							ref={ ( element ) =>
								( tabRefs.current[ tab.name ] = element )
							}
							type="button"
							role="tab"
							className="code-bin__tab"
							id={ `${ instanceId }-tab-${ tab.name }` }
							aria-controls={ `${ instanceId }-panel-${ tab.name }` }
							aria-selected={ activeTab === tab.name }
							tabIndex={ activeTab === tab.name ? 0 : -1 }
							onClick={ () => setActiveTab( tab.name ) }
							onKeyDown={ ( event ) =>
								onTabKeyDown( event, index )
							}
						>
							{ tab.title }
							{ tab.name === 'console' && entries.length > 0 && (
								<span
									className={ `code-bin__count${
										hasErrors ? ' has-errors' : ''
									}` }
								>
									{ entries.length }
								</span>
							) }
						</button>
					) ) }
				</div>
				<Button
					variant="secondary"
					size="small"
					onClick={ () => previewRef.current?.run( codeRef.current ) }
				>
					{ __( 'Run', 'code-bin-block' ) }
				</Button>
			</div>
			<div
				className={ `code-bin__status is-${ status.state }` }
				role="status"
				hidden={ ! message }
			>
				{ message }
			</div>
			<div
				className="code-bin__output"
				role="tabpanel"
				id={ `${ instanceId }-panel-result` }
				aria-labelledby={ `${ instanceId }-tab-result` }
				hidden={ activeTab !== 'result' }
			>
				<iframe
					ref={ iframeRef }
					className="code-bin__preview"
					title={ __( 'Code preview', 'code-bin-block' ) }
					sandbox="allow-scripts"
					style={ { height } }
				/>
			</div>
			<div
				className="code-bin__output"
				role="tabpanel"
				id={ `${ instanceId }-panel-console` }
				aria-labelledby={ `${ instanceId }-tab-console` }
				hidden={ activeTab !== 'console' }
			>
				<div
					className="code-bin__console"
					role="log"
					style={ { height } }
					data-empty={ __(
						'Console messages from the JavaScript will appear here.',
						'code-bin-block'
					) }
				>
					{ entries.map( ( entry, index ) => (
						<div
							key={ index }
							className={ `code-bin__console-entry is-${ entry.level }` }
						>
							{ entry.text }
						</div>
					) ) }
				</div>
			</div>
		</div>
	);
}

/**
 * Edit component.
 *
 * @param {Object}                       props               Props.
 * @param {Object}                       props.attributes    Block attributes.
 * @param {(attributes: Object) => void} props.setAttributes Attribute setter.
 * @return {Element} Element to render.
 */
export default function Edit( { attributes, setAttributes } ) {
	const { html, css, javascript, editable, previewHeight } = attributes;

	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'Settings', 'code-bin-block' ) }>
					<ToggleControl
						__nextHasNoMarginBottom
						label={ __(
							'Allow visitors to edit the code',
							'code-bin-block'
						) }
						help={ __(
							'Visitors can experiment with the code on the front end. Their changes are not saved.',
							'code-bin-block'
						) }
						checked={ editable }
						onChange={ ( value ) =>
							setAttributes( { editable: value } )
						}
					/>
					<RangeControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={ __( 'Preview height', 'code-bin-block' ) }
						value={ previewHeight }
						onChange={ ( value ) =>
							setAttributes( { previewHeight: value ?? 300 } )
						}
						min={ 100 }
						max={ 1200 }
						step={ 10 }
					/>
				</PanelBody>
			</InspectorControls>
			<div { ...useBlockProps( { className: 'code-bin' } ) }>
				<TabPanel
					className="code-bin__tabs"
					activeClass="is-active"
					tabs={ PANELS.map( ( panel ) => ( {
						name: panel.name,
						title: attributes[ panel.name ]
							? `${ panel.title } •`
							: panel.title,
					} ) ) }
				>
					{ ( tab ) => {
						const panel = PANELS.find(
							( { name } ) => name === tab.name
						);
						return (
							<CodeInput
								key={ panel.name }
								language={ panel.language }
								value={ attributes[ panel.name ] }
								onChange={ ( value ) =>
									setAttributes( { [ panel.name ]: value } )
								}
								label={ panel.title }
								placeholder={ panel.placeholder }
							/>
						);
					} }
				</TabPanel>
				<Preview
					code={ { html, css, javascript } }
					height={ previewHeight }
				/>
			</div>
		</>
	);
}
