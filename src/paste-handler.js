import { pasteHandler, createBlock } from '@wordpress/blocks';
import { dispatch } from '@wordpress/data';
import { parseNotation, hasNotation } from './notation-parser';

/**
 * Install a paste event listener on the document (capture phase)
 * to intercept :::type ... ::: notation before Gutenberg processes it.
 *
 * Only intervenes when the pasted text contains our notation.
 * All other paste events pass through to Gutenberg untouched.
 */
export function installPasteHandler() {
	// eslint-disable-next-line no-console
	console.log( '[WPMTG] Paste handler installed' );

	document.addEventListener(
		'paste',
		( event ) => {
			// eslint-disable-next-line no-console
			console.log( '[WPMTG] Paste event captured', {
				target: event.target,
				phase: event.eventPhase,
			} );

			const plainText =
				event.clipboardData?.getData( 'text/plain' ) ?? '';

			// eslint-disable-next-line no-console
			console.log( '[WPMTG] plainText:', JSON.stringify( plainText ) );

			// Only intervene when our notation is present
			if ( ! plainText || ! hasNotation( plainText ) ) {
				// eslint-disable-next-line no-console
				console.log( '[WPMTG] No notation found, passing through' );
				return;
			}

			const segments = parseNotation( plainText );

			// eslint-disable-next-line no-console
			console.log( '[WPMTG] Parsed segments:', segments );

			// If no callout segments were found, let Gutenberg handle it
			if ( ! segments.some( ( s ) => s.type === 'callout' ) ) {
				return;
			}

			// Block Gutenberg's default paste processing
			event.preventDefault();
			event.stopImmediatePropagation();

			// eslint-disable-next-line no-console
			console.log(
				'[WPMTG] Prevented default, converting to blocks...'
			);

			// Convert each segment to blocks
			const allBlocks = [];

			for ( const segment of segments ) {
				if ( segment.type === 'callout' ) {
					// Convert inner content to blocks via Gutenberg's pasteHandler
					const innerBlocks = pasteHandler( {
						plainText: segment.content,
						mode: 'BLOCKS',
					} );

					// eslint-disable-next-line no-console
					console.log( '[WPMTG] Inner blocks:', innerBlocks );

					const groupBlock = createBlock(
						'core/group',
						{
							className: `is-style-${ segment.calloutType }`,
						},
						Array.isArray( innerBlocks ) ? innerBlocks : []
					);

					allBlocks.push( groupBlock );
				} else if ( segment.content.trim() ) {
					// Non-callout text: convert normally
					const normalBlocks = pasteHandler( {
						plainText: segment.content,
						mode: 'BLOCKS',
					} );

					if ( Array.isArray( normalBlocks ) ) {
						allBlocks.push( ...normalBlocks );
					}
				}
			}

			// eslint-disable-next-line no-console
			console.log( '[WPMTG] All blocks to insert:', allBlocks );

			if ( allBlocks.length > 0 ) {
				dispatch( 'core/block-editor' ).insertBlocks( allBlocks );
			}
		},
		true // capture phase — fire before Gutenberg's handler
	);
}
