/**
 * Supported callout types. Add entries here to support new types.
 */
const CALLOUT_TYPES = [ 'vk-group-alert-info', 'vk-group-alert-warning', 'vk-group-alert-success' ];

/**
 * Shorthand notation map.
 * Keys are shorthand names used in :::key notation.
 * Values are the style names applied as is-style-{value}.
 *
 * Example: :::info  →  is-style-comp-info
 */
const SHORTHAND_MAP = {
	info: 'comp-info',
	warning: 'comp-warning',
	success: 'comp-success',
};

/**
 * All recognized callout type strings for regex matching.
 * Combines full type names and shorthand keys.
 */
const ALL_CALLOUT_TYPES = [ ...CALLOUT_TYPES, ...Object.keys( SHORTHAND_MAP ) ];

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
 * Parse plain text and extract :::type ... ::: blocks and image lines.
 *
 * Returns an array of segments:
 *   { type: 'text',    content: '...' }
 *   { type: 'image',   alt: '...', url: '...', href?: '...' }
 *   { type: 'callout', calloutType: '...', content: '...', innerSegments: [...] }
 *
 * @param {string} text Plain text to parse
 * @return {Array} Parsed segments
 */
export function parseNotation( text ) {
	// Normalize line endings
	const normalized = text.replace( /\r\n/g, '\n' );

	const typePattern = ALL_CALLOUT_TYPES.join( '|' );
	const regex = new RegExp(
		`^:::(${ typePattern })\\s*\\n([\\s\\S]*?)\\n^[ \\t]*:::[ \\t]*$`,
		'gm'
	);

	const segments = [];
	let lastIndex = 0;
	let match;

	while ( ( match = regex.exec( normalized ) ) !== null ) {
		if ( match.index > lastIndex ) {
			segments.push(
				...splitTextByImages( normalized.slice( lastIndex, match.index ) )
			);
		}

		const rawType = match[ 1 ];
		const resolvedType = SHORTHAND_MAP[ rawType ] || rawType;

		segments.push( {
			type: 'callout',
			calloutType: resolvedType,
			content: match[ 2 ],
			innerSegments: splitTextByImages( match[ 2 ] ),
		} );

		lastIndex = match.index + match[ 0 ].length;
	}

	if ( lastIndex < normalized.length ) {
		segments.push( ...splitTextByImages( normalized.slice( lastIndex ) ) );
	}

	return segments;
}

/**
 * Check if text contains any supported notation (callout blocks or image lines).
 *
 * @param {string} text Plain text to check
 * @return {boolean} True if notation is found
 */
export function hasNotation( text ) {
	const typePattern = ALL_CALLOUT_TYPES.join( '|' );
	const calloutRegex = new RegExp( `^:::(${ typePattern })\\s*$`, 'm' );
	return calloutRegex.test( text ) || PLAIN_IMAGE_REGEX.test( text ) || LINKED_IMAGE_REGEX.test( text );
}

export { CALLOUT_TYPES, SHORTHAND_MAP };
