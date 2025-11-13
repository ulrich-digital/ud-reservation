<?php
// =====================================================
// 🔐 AJAX Login
// =====================================================

add_action('wp_ajax_nopriv_ajax_login', 'ud_ajax_login_handler');
function ud_ajax_login_handler() {
	$login    = sanitize_text_field($_POST['log'] ?? '');
	$password = $_POST['pwd'] ?? '';

	if (empty($login) || empty($password)) {
		wp_send_json_error(['message' => __('Bitte alle Felder ausfüllen.', 'ud-reservation-ud')]);
	}

	$user = wp_signon([
		'user_login'    => $login,
		'user_password' => $password,
		'remember'      => true,
	], false);

	if (is_wp_error($user)) {
		wp_send_json_error([
			'message' => __('Falscher Benutzername oder Passwort.', 'ud-reservation-ud'),
			'debug'   => $user->get_error_message(),
		]);
	}

	wp_set_current_user($user->ID);
	wp_set_auth_cookie($user->ID, true);

	wp_send_json_success(['message' => __('Login erfolgreich.', 'ud-reservation-ud')]);
}



// =====================================================
// 🔄 Realtime-Events über Ably
// =====================================================

/**
 * Sendet ein Realtime-Event an Ably.
 *
 * @param string $event   Event-Name (z. B. reservation_delete, soldout_update)
 * @param array  $payload Daten, die an Ably gesendet werden sollen
 */
function ud_reservation_send_ably_event($event, $payload = []) {
	if (!defined('ABLY_API_KEY') || empty(ABLY_API_KEY)) {
		return;
	}

	$url  = 'https://rest.ably.io/channels/reservations/messages';
	$auth = base64_encode(ABLY_API_KEY);

	$args = [
		'headers' => [
			'Authorization' => 'Basic ' . $auth,
			'Content-Type'  => 'application/json',
		],
		'body'    => wp_json_encode([
			'name' => $event,
			'data' => $payload,
		]),
		'timeout' => 5,
	];

	wp_remote_post($url, $args);
}



// =====================================================
// 🆕 Soldout-Events automatisch senden
// =====================================================

/**
 * Wird aufgerufen, wenn ein ud-soldout Beitrag gespeichert oder gelöscht wird.
 * Sendet ein „soldout_update“ Event an Ably, damit der Badge live aktualisiert wird.
 */
function ud_reservation_trigger_soldout_update($post_id) {
	if (get_post_type($post_id) !== 'ud-soldout') {
		return;
	}

	$status = (bool) get_post_meta($post_id, 'status', true);

	ud_reservation_send_ably_event('soldout_update', [
		'date'   => get_the_title($post_id),
		'status' => $status,
		'action' => current_filter(),
		'time'   => current_time('mysql'),
	]);
}
add_action('save_post_ud-soldout', 'ud_reservation_trigger_soldout_update');

