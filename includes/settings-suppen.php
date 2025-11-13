<?php
/* settings-suppen.php */

/**
 * 🥣 UD Reservation – Suppentage Verwaltung (mit Anzeigemodus + Intervall)
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Admin-Menüpunkt
 */
add_action( 'admin_menu', function() {
	add_options_page(
		'Suppentage',
		'Suppentage',
		'manage_options',
		'ud_suppentage',
		'ud_render_suppentage_page'
	);
});

/**
 * Medienbibliothek einbinden
 */
add_action( 'admin_enqueue_scripts', function( $hook ) {
	if ( $hook === 'settings_page_ud_suppentage' ) {
		wp_enqueue_media();
		wp_enqueue_script(
			'ud-suppentage-media',
			plugin_dir_url( __FILE__ ) . 'ud-suppentage-media.js',
			[ 'jquery' ],
			false,
			true
		);
	}
});

/**
 * Seite rendern
 */
function ud_render_suppentage_page() {
	if ( ! current_user_can( 'manage_options' ) ) {
		return;
	}

	$suppen = get_option( 'ud_suppentage', [] );
	$settings = get_option( 'ud_suppentage_settings', [
		'mode'     => 'both', // 'reservations', 'image', 'both'
		'interval' => 10,     // Sekunden
	]);

	$tage = [ 'montag', 'dienstag', 'mittwoch', 'donnerstag', 'freitag' ];

	// Speichern
	if ( isset( $_POST['ud_suppen_save'] ) && check_admin_referer( 'ud_suppen_save_action', 'ud_suppen_nonce' ) ) {

		// Suppen speichern
		$neu = [];
		foreach ( $tage as $tag ) {
			$neu[$tag] = [
				'name'   => sanitize_text_field( $_POST["{$tag}_name"] ?? '' ),
			];
		}
		update_option( 'ud_suppentage', $neu );
		$suppen = $neu;

		// Zusätzliche Einstellungen speichern
		$settings['mode']     = sanitize_text_field( $_POST['ud_mode'] ?? 'both' );
		$settings['interval'] = max( 0, intval( $_POST['ud_interval'] ?? 10 ) );
		update_option( 'ud_suppentage_settings', $settings );

		echo '<div class="updated"><p><strong>Suppentage & Einstellungen gespeichert.</strong></p></div>';
	}
	?>

	<div class="wrap">
		<h1>Suppentage verwalten</h1>
		<p>Hier kannst du für jeden Wochentag eine Suppe hinterlegen.</p>

		<form method="post" action="">
			<?php wp_nonce_field( 'ud_suppen_save_action', 'ud_suppen_nonce' ); ?>



			<h2 style="margin-top:2em;">Wochensuppen</h2>
			<table class="widefat fixed striped">
				<thead>
					<tr>
						<th>Tag</th>
						<th>Suppenname</th>
					</tr>
				</thead>
				<tbody>
					<?php foreach ( $tage as $tag ) :
						$name   = $suppen[$tag]['name'] ?? '';
						?>
						<tr>
							<td><strong><?= ucfirst( $tag ) ?></strong></td>
							<td><input type="text" name="<?= $tag ?>_name" value="<?= esc_attr( $name ) ?>" class="regular-text"></td>
						</tr>
					<?php endforeach; ?>
				</tbody>
			</table>

			<p><input type="submit" name="ud_suppen_save" class="button button-primary" value="Speichern"></p>
		</form>
	</div>
	<?php
}
