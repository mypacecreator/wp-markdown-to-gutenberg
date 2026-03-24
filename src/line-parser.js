/**
 * Regex for button notation: [btn](url) label  or  [btn style-name](url) label
 * Captures: [1] optional style name (with leading space), [2] url, [3] label
 */
const BUTTON_REGEX = /^\[btn( [\w-]+)?\]\(([^)]+)\)\s+(.+)$/;

/**
 * Parse a text string line-by-line, extracting button notation lines.
 *
 * Returns an array of segments:
 *   { type: 'text',   content: string }
 *   { type: 'button', url: string, label: string, className: string }
 *
 * Lines that do not match any notation are accumulated in a buffer and
 * flushed as a 'text' segment when a match is found or at the end.
 *
 * @param {string} text Plain text to parse
 * @return {Array} Parsed segments
 */
export function parseLineSegments( text, shorthandMap = {} ) {
	const lines = text.split( '\n' );
	const result = [];
	let buffer = [];

	const flushBuffer = () => {
		if ( buffer.length ) {
			result.push( { type: 'text', content: buffer.join( '\n' ) } );
			buffer = [];
		}
	};

	for ( const line of lines ) {
		const btnMatch = BUTTON_REGEX.exec( line );
		if ( btnMatch ) {
			flushBuffer();
			const rawStyle = btnMatch[ 1 ] ? btnMatch[ 1 ].trim() : '';
			const resolvedStyle = shorthandMap[ rawStyle ] || rawStyle;
			result.push( {
				type: 'button',
				url: btnMatch[ 2 ],
				label: btnMatch[ 3 ],
				className: resolvedStyle ? `is-style-${ resolvedStyle }` : '',
			} );
			continue;
		}

		buffer.push( line );
	}

	flushBuffer();

	return result;
}

export { BUTTON_REGEX };
