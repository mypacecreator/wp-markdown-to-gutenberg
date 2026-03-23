<?php
/**
 * Plugin Name: WP Markdown to Gutenberg
 * Description: Converts custom markdown notation (:::info, :::warning, :::highlight) to Gutenberg group blocks on paste.
 * Version: 0.1.0
 * Requires at least: 6.0
 * Requires PHP: 7.4
 */

defined( 'ABSPATH' ) || exit;

add_action( 'enqueue_block_editor_assets', function () {
	$asset_file = __DIR__ . '/build/index.asset.php';

	if ( ! file_exists( $asset_file ) ) {
		return;
	}

	$asset = require $asset_file;

	wp_enqueue_script(
		'wp-markdown-to-gutenberg',
		plugins_url( 'build/index.js', __FILE__ ),
		$asset['dependencies'],
		$asset['version']
	);

	$json_path     = __DIR__ . '/shorthand-map.json';
	$shorthand_map = [];
	if ( file_exists( $json_path ) ) {
		$raw     = file_get_contents( $json_path );
		$decoded = json_decode( $raw, true );
		if ( is_array( $decoded ) ) {
			$shorthand_map = $decoded;
		}
	}

	wp_localize_script(
		'wp-markdown-to-gutenberg',
		'wpmtgConfig',
		[ 'shorthandMap' => $shorthand_map ]
	);
} );
