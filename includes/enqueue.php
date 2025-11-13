<?php
/*
add_action( 'enqueue_block_assets', function() {
	wp_enqueue_script(
		'ud-reservation-frontend',
		UD_RESERVATION_URL . 'build/frontend.js',
		[ 'wp-element', 'wp-api-fetch' ],
		filemtime( UD_RESERVATION_PATH . 'build/frontend.js' ),
		true
	);

	wp_localize_script( 'ud-reservation-frontend', 'udReservationSettings', [
		'nonce' => wp_create_nonce( 'wp_rest' ),
		'rest_url' => esc_url_raw( rest_url() ),
		'user' => get_current_user_id(),
	]);
});
*/


// 1️⃣  dein bestehender enqueue_block_assets bleibt wie er ist
add_action( 'enqueue_block_assets', function() {
	wp_enqueue_script(
		'ud-reservation-frontend',
		UD_RESERVATION_URL . 'build/frontend.js',
		[ 'wp-element', 'wp-api-fetch' ],
		filemtime( UD_RESERVATION_PATH . 'build/frontend.js' ),
		true
	);
});

// 2️⃣  Flatpickr wird weiter in enqueue_block_assets (Priority 5) geladen
add_action( 'enqueue_block_assets', function() {
	$base = plugin_dir_url( dirname( __FILE__ ) );

	wp_enqueue_style( 'flatpickr-css', $base . 'assets/vendor/flatpickr/flatpickr.min.css', [], '4.6.13' );
	wp_enqueue_script( 'flatpickr-js', $base . 'assets/vendor/flatpickr/flatpickr.min.js', [], '4.6.13', true );
	wp_enqueue_script( 'flatpickr-de', $base . 'assets/vendor/flatpickr/de.js', [ 'flatpickr-js' ], '4.6.13', true );
}, 5 );

// 3️⃣  udResFlatpickr NACH Registrierung des Scripts einfügen
add_action( 'wp_print_scripts', function() {
	if ( wp_script_is( 'ud-reservation-frontend', 'enqueued' ) ) {
		$base = plugin_dir_url( dirname( __FILE__ ) );
		wp_localize_script( 'ud-reservation-frontend', 'udResFlatpickr', [
			'js'   => $base . 'assets/vendor/flatpickr/flatpickr.min.js',
			'i18n' => $base . 'assets/vendor/flatpickr/de.js',
			'css'  => $base . 'assets/vendor/flatpickr/flatpickr.min.css',
		] );
	}
});



