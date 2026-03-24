/**
 * Regex for button notation (loose check for hasNotation early return).
 */
const BUTTON_NOTATION_REGEX = /^\[btn[ \]]/m;

/**
 * Regex for more notation: :::more:::
 */
const MORE_NOTATION_REGEX = /^:::more:::[ \t\r]*$/m;

/**
 * Regex for linked image: [![alt](img-url)](link-url)
 */
const LINKED_IMAGE_REGEX = /^\[!\[([^\]]*)\]\(([^)]+)\)\]\(([^)]+)\)\s*$/m;

/**
 * Regex for plain image: ![alt](img-url)
 */
const PLAIN_IMAGE_REGEX = /^!\[([^\]]*)\]\(([^)]+)\)\s*$/m;

/**
 * Split a text string into segments, extracting standalone image lines.
 *
 * Returns an array of segments:
 *   { type: 'text',  content: '...' }
 *   { type: 'image', alt: '...', url: '...', href?: '...' }
 *
 * Pattern 2 (linked image) is evaluated before Pattern 1 (plain image).
 *
 * @param {string} text Plain text to parse
 * @return {Array} Parsed segments
 */
function splitTextByImages( text ) {
	const lines = text.split( '\n' );
	const result = [];
	let buffer = [];

	for ( const line of lines ) {
		const linked = LINKED_IMAGE_REGEX.exec( line );
		if ( linked ) {
			if ( buffer.length ) {
				result.push( { type: 'text', content: buffer.join( '\n' ) } );
				buffer = [];
			}
			result.push( { type: 'image', alt: linked[ 1 ], url: linked[ 2 ], href: linked[ 3 ] } );
			continue;
		}

		const plain = PLAIN_IMAGE_REGEX.exec( line );
		if ( plain ) {
			if ( buffer.length ) {
				result.push( { type: 'text', content: buffer.join( '\n' ) } );
				buffer = [];
			}
			result.push( { type: 'image', alt: plain[ 1 ], url: plain[ 2 ] } );
			continue;
		}

		buffer.push( line );
	}

	if ( buffer.length ) {
		result.push( { type: 'text', content: buffer.join( '\n' ) } );
	}

	return result;
}

/**
 * Source pattern for :::media-text blocks with optional position and width.
 *
 * :::media-text [right] [40%]
 * ![alt](url)
 * Text content
 * :::
 */
const MEDIA_TEXT_PATTERN =
	'^:::media-text(?:\\s+(right))?(?:\\s+(\\d+)%)?\\s*\\n([\\s\\S]*?)\\n^[ \\t]*:::[ \\t]*$';

/**
 * Extract the first image segment from an array of segments parsed by
 * splitTextByImages, returning the image and the remaining segments.
 *
 * @param {Array} segments Segments from splitTextByImages
 * @return {{ imageSegment: Object|null, rest: Array }}
 */
function extractFirstImage( segments ) {
	let imageSegment = null;
	const rest = [];

	for ( const seg of segments ) {
		if ( ! imageSegment && seg.type === 'image' ) {
			imageSegment = seg;
		} else {
			rest.push( seg );
		}
	}

	return { imageSegment, rest };
}

/**
 * Parse plain text and extract :::type ... ::: blocks, :::media-text blocks,
 * and image lines.
 *
 * Returns an array of segments:
 *   { type: 'text',       content: '...' }
 *   { type: 'image',      alt: '...', url: '...', href?: '...' }
 *   { type: 'callout',    calloutType: '...', content: '...', innerSegments: [...] }
 *   { type: 'media-text', mediaPosition: 'left'|'right', mediaWidth: number,
 *                          imageSegment: { alt, url, href? }, innerSegments: [...] }
 *
 * @param {string} text Plain text to parse
 * @return {Array} Parsed segments
 */
export function parseNotation( text, shorthandMap = {} ) {
	// Normalize line endings
	const normalized = text.replace( /\r\n/g, '\n' );

	// Collect all fenced-block matches with their positions
	const matches = [];

	// Callout blocks — generic pattern accepts any ASCII identifier after :::
	const calloutRegex = /^:::([a-zA-Z][a-zA-Z0-9_-]*)\s*\n([\s\S]*?)\n^[ \t]*:::[ \t]*$/gm;
	let m;
	while ( ( m = calloutRegex.exec( normalized ) ) !== null ) {
		// Skip media-text blocks (handled by dedicated regex below)
		if ( m[ 1 ] === 'media-text' ) {
			continue;
		}
		matches.push( {
			kind: 'callout',
			index: m.index,
			length: m[ 0 ].length,
			calloutType: m[ 1 ],
			content: m[ 2 ],
		} );
	}

	// Media-text blocks
	const mediaTextRegex = new RegExp( MEDIA_TEXT_PATTERN, 'gm' );
	while ( ( m = mediaTextRegex.exec( normalized ) ) !== null ) {
		matches.push( {
			kind: 'media-text',
			index: m.index,
			length: m[ 0 ].length,
			position: m[ 1 ] || null,
			width: m[ 2 ] || null,
			content: m[ 3 ],
		} );
	}

	// More blocks (:::more:::)
	const moreRegex = new RegExp( MORE_NOTATION_REGEX.source, 'gm' );
	while ( ( m = moreRegex.exec( normalized ) ) !== null ) {
		matches.push( {
			kind: 'more',
			index: m.index,
			length: m[ 0 ].length,
		} );
	}

	// Sort by position in text
	matches.sort( ( a, b ) => a.index - b.index );

	// Build segments from matches
	const segments = [];
	let lastIndex = 0;

	for ( const mt of matches ) {
		// Skip overlapping matches
		if ( mt.index < lastIndex ) {
			continue;
		}

		if ( mt.index > lastIndex ) {
			segments.push(
				...splitTextByImages(
					normalized.slice( lastIndex, mt.index )
				)
			);
		}

		if ( mt.kind === 'callout' ) {
			const rawType = mt.calloutType;
			const resolvedType = shorthandMap[ rawType ] || rawType;

			segments.push( {
				type: 'callout',
				calloutType: resolvedType,
				content: mt.content,
				innerSegments: splitTextByImages( mt.content ),
			} );
		} else if ( mt.kind === 'media-text' ) {
			const innerParsed = splitTextByImages( mt.content );
			const { imageSegment, rest } = extractFirstImage( innerParsed );

			segments.push( {
				type: 'media-text',
				mediaPosition: mt.position || 'left',
				mediaWidth: mt.width
					? Math.max( 15, Math.min( 85, parseInt( mt.width, 10 ) ) )
					: 50,
				imageSegment: imageSegment || null,
				innerSegments: rest,
			} );
		} else if ( mt.kind === 'more' ) {
			segments.push( { type: 'more' } );
		}

		lastIndex = mt.index + mt.length;
	}

	if ( lastIndex < normalized.length ) {
		segments.push( ...splitTextByImages( normalized.slice( lastIndex ) ) );
	}

	return segments;
}

/**
 * Check if text contains any supported notation
 * (callout blocks, image lines, or button notation).
 *
 * @param {string} text Plain text to check
 * @return {boolean} True if notation is found
 */
export function hasNotation( text ) {
	const calloutRegex = /^:::([a-zA-Z][a-zA-Z0-9_-]*)\s*$/m;
	return (
		calloutRegex.test( text ) ||
		MORE_NOTATION_REGEX.test( text ) ||
		PLAIN_IMAGE_REGEX.test( text ) ||
		LINKED_IMAGE_REGEX.test( text ) ||
		BUTTON_NOTATION_REGEX.test( text )
	);
}
