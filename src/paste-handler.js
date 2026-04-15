import { pasteHandler, createBlock, getBlockType } from '@wordpress/blocks';
import { dispatch, select } from '@wordpress/data';
import { parseNotation, hasNotation } from './notation-parser';
import { parseLineSegments } from './line-parser';

/**
 * Get the nearest enclosing Gutenberg block's clientId from a DOM event.
 * Gutenberg annotates block wrapper elements with data-block="clientId".
 *
 * @param {Event} event  The DOM event (e.g. paste)
 * @return {string|null} clientId or null if not found
 */
function getTargetClientId( event ) {
	const blockEl = event.target?.closest( '[data-block]' );
	return blockEl?.dataset?.block ?? null;
}

/**
 * Convert a button segment to a core/buttons > core/button block.
 *
 * @param {Object} segment  Button segment with url, label, and className
 * @return {Object} core/buttons block wrapping a core/button inner block
 */
function buttonsSegmentToBlock( segment ) {
	const btn = createBlock( 'core/button', {
		text: segment.label,
		url: segment.url,
		className: segment.className,
	} );
	return createBlock( 'core/buttons', {
		fontSize: 'medium',
		layout: { type: 'flex', justifyContent: 'center' },
	}, [ btn ] );
}

const shorthandConfig = ( typeof window !== 'undefined'
	&& window.wpmtgConfig
	&& window.wpmtgConfig.shorthandMap ) || {};
const calloutShorthandMap = shorthandConfig.callout || {};
const buttonShorthandMap = shorthandConfig.button || {};
const reuseShorthandMap = shorthandConfig.reuse || {};

/**
 * Convert an image segment to a core/image block.
 *
 * @param {Object} segment  Image segment with url, alt, and optional href
 * @return {Object} core/image block
 */
function imageSegmentToBlock( segment ) {
	const attrs = { url: segment.url, alt: segment.alt };
	if ( segment.href ) {
		attrs.href = segment.href;
		attrs.linkDestination = 'custom';
	}
	return createBlock( 'core/image', attrs );
}

/**
 * Convert an embed segment to a visual-link-preview/link block.
 * Falls back to a core/paragraph with a link if the plugin is not active.
 *
 * @param {Object} segment  Embed segment with url
 * @return {Object} visual-link-preview/link or core/paragraph block
 */
function isHttpUrl( url ) {
	try {
		const parsed = new URL( url );
		return parsed.protocol === 'http:' || parsed.protocol === 'https:';
	} catch ( e ) {
		return false;
	}
}

function utf8ToBase64( str ) {
	const bytes = new TextEncoder().encode( str );
	let binary = '';
	for ( let i = 0; i < bytes.length; i++ ) {
		binary += String.fromCharCode( bytes[ i ] );
	}
	return btoa( binary );
}

function embedSegmentToBlock( segment ) {
	if ( ! getBlockType( 'visual-link-preview/link' ) ) {
		if ( ! isHttpUrl( segment.url ) ) {
			return createBlock( 'core/paragraph', {
				content: segment.url,
			} );
		}
		const escapedUrl = segment.url
			.replace( /&/g, '&amp;' )
			.replace( /"/g, '&quot;' )
			.replace( /</g, '&lt;' )
			.replace( />/g, '&gt;' );
		return createBlock( 'core/paragraph', {
			content: `<a href="${ escapedUrl }">${ escapedUrl }</a>`,
		} );
	}

	const encoded = utf8ToBase64( JSON.stringify( {
		type: 'external',
		post: 0,
		post_label: '',
		url: segment.url,
		provider_used: 'php',
		template: 'simple',
		nofollow: false,
		new_tab: true,
		title: '',
		summary: '',
		image_id: -1,
		image_url: '',
		custom_class: 'wp-block-visual-link-preview-link',
	} ) );

	return createBlock( 'visual-link-preview/link', {
		url: segment.url,
		nofollow: false,
		new_tab: true,
		image_id: -1,
		type: 'external',
		provider_used: 'php',
		template: 'simple',
		encoded,
	} );
}

/**
 * Convert an array of inner segments (from notation-parser) into blocks.
 *
 * @param {Array} innerSegments  Parsed segments (image, embed, or text)
 * @return {Array} Gutenberg blocks
 */
function innerSegmentsToBlocks( innerSegments ) {
	// Expand text segments to detect button and reuse notation line-by-line,
	// mirroring the same flatMap applied to top-level segments in onPaste().
	const expandedSegments = innerSegments.flatMap( ( inner ) =>
		inner.type === 'text'
			? parseLineSegments( inner.content, buttonShorthandMap, reuseShorthandMap )
			: [ inner ]
	);

	const blocks = [];
	for ( const inner of expandedSegments ) {
		if ( inner.type === 'image' ) {
			blocks.push( imageSegmentToBlock( inner ) );
		} else if ( inner.type === 'embed' ) {
			blocks.push( embedSegmentToBlock( inner ) );
		} else if ( inner.type === 'button' ) {
			blocks.push( buttonsSegmentToBlock( inner ) );
		} else if ( inner.type === 'reuse' ) {
			if ( inner.id !== null && inner.id > 0 ) {
				blocks.push( createBlock( 'core/block', { ref: inner.id } ) );
			} else if ( inner.raw ) {
				const converted = pasteHandler( { plainText: inner.raw, mode: 'BLOCKS' } );
				if ( Array.isArray( converted ) ) {
					blocks.push( ...converted );
				}
			}
		} else if ( inner.content.trim() ) {
			const converted = pasteHandler( {
				plainText: inner.content,
				mode: 'BLOCKS',
			} );
			if ( Array.isArray( converted ) ) {
				blocks.push( ...converted );
			}
		}
	}
	return blocks;
}

/**
 * The paste event handler.
 * Intercepts paste containing :::type notation or image lines, converts to
 * group/image blocks, and inserts them via the block editor data store.
 *
 * @param {ClipboardEvent} event
 */
function onPaste( event ) {
	// eslint-disable-next-line no-console
	console.log( '[WPMTG] Paste event captured', {
		target: event.target?.tagName,
		phase: event.eventPhase,
	} );

	const plainText = event.clipboardData?.getData( 'text/plain' ) ?? '';

	// eslint-disable-next-line no-console
	console.log( '[WPMTG] plainText:', JSON.stringify( plainText ) );

	if ( ! plainText || ! hasNotation( plainText ) ) {
		// eslint-disable-next-line no-console
		console.log( '[WPMTG] No notation found, passing through' );
		return;
	}

	const rawSegments = parseNotation( plainText, calloutShorthandMap );

	// Expand text segments to detect button and reuse notation line-by-line
	const segments = rawSegments.flatMap( ( s ) =>
		s.type === 'text'
			? parseLineSegments( s.content, buttonShorthandMap, reuseShorthandMap )
			: [ s ]
	);

	// eslint-disable-next-line no-console
	console.log( '[WPMTG] Parsed segments:', segments );

	const hasActionable = segments.some(
		( s ) =>
			s.type === 'callout' ||
			s.type === 'image' ||
			s.type === 'embed' ||
			s.type === 'button' ||
			s.type === 'media-text' ||
			s.type === 'more' ||
			s.type === 'reuse'
	);
	if ( ! hasActionable ) {
		return;
	}

	const allBlocks = [];

	for ( const segment of segments ) {
		if ( segment.type === 'button' ) {
			allBlocks.push( buttonsSegmentToBlock( segment ) );
		} else if ( segment.type === 'image' ) {
			allBlocks.push( imageSegmentToBlock( segment ) );
		} else if ( segment.type === 'embed' ) {
			allBlocks.push( embedSegmentToBlock( segment ) );
		} else if ( segment.type === 'more' ) {
			allBlocks.push( createBlock( 'core/more' ) );
		} else if ( segment.type === 'callout' ) {
			const innerBlocks = innerSegmentsToBlocks( segment.innerSegments );

			// eslint-disable-next-line no-console
			console.log( '[WPMTG] Inner blocks:', innerBlocks );

			const groupBlock = createBlock(
				'core/group',
				{
					className: `is-style-${ segment.calloutType }`,
				},
				innerBlocks
			);

			allBlocks.push( groupBlock );
		} else if ( segment.type === 'media-text' ) {
			if ( ! segment.imageSegment ) {
				// No image found — fall back to normal text handling
				allBlocks.push( ...innerSegmentsToBlocks( segment.innerSegments ) );
				continue;
			}

			const innerBlocks = innerSegmentsToBlocks( segment.innerSegments );

			const mediaAttrs = {
				mediaType: 'image',
				mediaPosition: segment.mediaPosition,
				mediaWidth: segment.mediaWidth,
			};

			if ( segment.imageSegment ) {
				mediaAttrs.mediaUrl = segment.imageSegment.url;
				mediaAttrs.mediaAlt = segment.imageSegment.alt || '';

				if ( segment.imageSegment.href ) {
					mediaAttrs.href = segment.imageSegment.href;
					mediaAttrs.linkDestination = 'custom';
				}
			}

			// eslint-disable-next-line no-console
			console.log( '[WPMTG] Media-text block:', mediaAttrs, innerBlocks );

			allBlocks.push(
				createBlock( 'core/media-text', mediaAttrs, innerBlocks )
			);
		} else if ( segment.type === 'reuse' ) {
			if ( segment.id !== null && segment.id > 0 ) {
				allBlocks.push( createBlock( 'core/block', { ref: segment.id } ) );
			} else if ( segment.raw ) {
				const converted = pasteHandler( { plainText: segment.raw, mode: 'BLOCKS' } );
				if ( Array.isArray( converted ) ) {
					allBlocks.push( ...converted );
				}
			}
		} else if ( segment.content.trim() ) {
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

	if ( allBlocks.length === 0 ) {
		// All segments failed to resolve (e.g. unknown alias or invalid ID) —
		// let Gutenberg handle the paste natively.
		return;
	}

	// Block Gutenberg's default paste processing only when we have blocks to insert
	event.preventDefault();
	event.stopImmediatePropagation();

	// eslint-disable-next-line no-console
	console.log( '[WPMTG] Prevented default, inserting blocks...' );

	// Determine insertion position.
	// Priority: (1) DOM-based clientId from event.target (survives tab switches),
	// (2) store selection, (3) default (appends to end).
	// rootClientId must be resolved before getBlockIndex to correctly handle
	// nested blocks (e.g. inside a Group block); without it getBlockIndex
	// searches only the root-level order and returns -1.
	const blockEditorSelect = select( 'core/block-editor' );
	const domTargetClientId = getTargetClientId( event );
	const selectedClientId = blockEditorSelect.getSelectedBlockClientId();
	let targetClientId = domTargetClientId || selectedClientId;
	let rootClientId;
	let insertionIndex = -1;

	if ( targetClientId ) {
		rootClientId =
			blockEditorSelect.getBlockRootClientId( targetClientId ) ||
			undefined;
		insertionIndex = blockEditorSelect.getBlockIndex(
			targetClientId,
			rootClientId
		);

		// If DOM-derived clientId is stale (returns -1), retry with the
		// store selection as a fallback.
		if (
			insertionIndex === -1 &&
			domTargetClientId &&
			selectedClientId &&
			selectedClientId !== domTargetClientId
		) {
			targetClientId = selectedClientId;
			rootClientId =
				blockEditorSelect.getBlockRootClientId( targetClientId ) ||
				undefined;
			insertionIndex = blockEditorSelect.getBlockIndex(
				targetClientId,
				rootClientId
			);
		}
	}

	if ( insertionIndex !== -1 ) {
		dispatch( 'core/block-editor' ).insertBlocks(
			allBlocks,
			insertionIndex + 1,
			rootClientId
		);
	} else {
		dispatch( 'core/block-editor' ).insertBlocks( allBlocks );
	}
}

/**
 * Attach the paste listener to a document object.
 *
 * @param {Document} doc  The document to attach to
 * @param {string}   label  Label for debug logging
 */
function attachToDocument( doc, label ) {
	doc.addEventListener( 'paste', onPaste, true );
	// eslint-disable-next-line no-console
	console.log( `[WPMTG] Paste handler installed on ${ label }` );
}

/**
 * Install paste handler on both the parent document (fallback for
 * non-iframe editors) and the editor iframe's document.
 *
 * The editor iframe is rendered asynchronously, so we poll until
 * it appears and its contentDocument is accessible.
 */
export function installPasteHandler() {
	// Fallback: attach to parent document (works if editor is NOT in iframe)
	attachToDocument( document, 'parent document' );

	// Poll for the editor iframe
	const POLL_INTERVAL_MS = 500;
	const MAX_ATTEMPTS = 60; // 30 seconds max
	let attempts = 0;

	const poller = setInterval( () => {
		attempts++;

		const iframe = document.querySelector(
			'iframe[name="editor-canvas"]'
		);

		if ( iframe && iframe.contentDocument ) {
			clearInterval( poller );
			attachToDocument( iframe.contentDocument, 'iframe document' );
			return;
		}

		if ( attempts >= MAX_ATTEMPTS ) {
			clearInterval( poller );
			// eslint-disable-next-line no-console
			console.log(
				'[WPMTG] Editor iframe not found after polling. Parent document listener is active as fallback.'
			);
		}
	}, POLL_INTERVAL_MS );
}
