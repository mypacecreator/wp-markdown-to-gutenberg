/**
 * Supported callout types. Add entries here to support new types.
 */
const CALLOUT_TYPES = [ 'vk-group-alert-info', 'vk-group-alert-warning', 'vk-group-alert-success' ];

/**
 * Parse plain text and extract :::type ... ::: blocks.
 *
 * Returns an array of segments:
 *   { type: 'text', content: '...' }
 *   { type: 'callout', calloutType: 'info', content: '...' }
 *
 * @param {string} text Plain text to parse
 * @return {Array} Parsed segments
 */
export function parseNotation( text ) {
	// Normalize line endings
	const normalized = text.replace( /\r\n/g, '\n' );

	const typePattern = CALLOUT_TYPES.join( '|' );
	const regex = new RegExp(
		`^:::(${ typePattern })\\s*\\n([\\s\\S]*?)\\n^[ \\t]*:::[ \\t]*$`,
		'gm'
	);

	const segments = [];
	let lastIndex = 0;
	let match;

	while ( ( match = regex.exec( normalized ) ) !== null ) {
		if ( match.index > lastIndex ) {
			segments.push( {
				type: 'text',
				content: normalized.slice( lastIndex, match.index ),
			} );
		}

		segments.push( {
			type: 'callout',
			calloutType: match[ 1 ],
			content: match[ 2 ],
		} );

		lastIndex = match.index + match[ 0 ].length;
	}

	if ( lastIndex < normalized.length ) {
		segments.push( {
			type: 'text',
			content: normalized.slice( lastIndex ),
		} );
	}

	return segments;
}

/**
 * Check if text contains any callout notation.
 *
 * @param {string} text Plain text to check
 * @return {boolean} True if notation is found
 */
export function hasNotation( text ) {
	const typePattern = CALLOUT_TYPES.join( '|' );
	const regex = new RegExp( `^:::(${ typePattern })\\s*$`, 'm' );
	return regex.test( text );
}

export { CALLOUT_TYPES };
