<?php

/* Datei: ably-events.php */

/**
 * 🔄 Ably Integration für UD Reservation Plugin
 *
 * Zweck:
 * Sendet Echtzeit-Events an Ably, sobald eine Reservation
 * oder ein "Ausverkauft-Tag" erstellt, aktualisiert oder gelöscht wird.
 *
 * Events:
 * - reservation_create
 * - reservation_update
 * - reservation_delete
 * - soldout_update (inkl. deleted=true bei Löschung)
 *
 * Kanalname: "reservations" (kann über Filter geändert werden)
 */

if (! defined('ABSPATH')) {
	exit;
}

/**
 * 🔑 API-Key abrufen (aus Option oder Konstante)
 */
function ud_reservation_get_ably_key()
{
	if (defined('ABLY_API_KEY') && ABLY_API_KEY) {
		return ABLY_API_KEY;
	}

	return get_option('ud_reservation_ably_key');
}

/**
 * 📡 Ably-Event senden (REST API)
 *
 * @param string $event_type
 * @param int    $post_id
 * @param array  $extra_data Optional zusätzlicher Payload
 */
function ud_reservation_publish_ably_event($event_type, $post_id, $extra_data = [])
{
	$post = get_post($post_id);

	if (! $post) {
		return;
	}

	$ably_key = ud_reservation_get_ably_key();
	if (! $ably_key) {
		error_log('[UD Reservation] ❌ Kein Ably-Key gefunden, Event nicht gesendet.');
		return;
	}

	// 🔒 Grundvalidierung
	if (! preg_match('/^[A-Za-z0-9._:-]+$/', $ably_key)) {
		error_log('[UD Reservation] ⚠️ Ungültiges Ably-Key-Format, Event abgebrochen.');
		return;
	}

	// Alle Metadaten erfassen (mit Struktur-Erhalt)
	$meta_raw = get_post_meta($post_id);

	// reset() benötigt Referenzen → daher vorher duplizieren
	$meta = [];
	foreach ($meta_raw as $key => $values) {
		if (is_array($values) && ! empty($values)) {
			$tmp         = $values;
			$first_value = reset($tmp);
			$meta[$key] = maybe_unserialize($first_value);
		}
	}

	$data = array_merge([
		'id'     => $post_id,
		'title'  => $post->post_title,
		'status' => $post->post_status,
		'type'   => $post->post_type,
		'meta'   => $meta,
		'user'   => wp_get_current_user()->user_login ?? 'system',
		'time'   => current_time('mysql'),
	], $extra_data);

	$channel = apply_filters('ud_reservation_ably_channel', 'reservations');
	$url     = "https://rest.ably.io/channels/{$channel}/messages";

	$args = [
		'headers' => [
			'Authorization' => 'Basic ' . base64_encode($ably_key . ':'),
			'Content-Type'  => 'application/json',
		],
		'body'    => wp_json_encode([
			'name' => $event_type,
			'data' => $data,
		]),
		'timeout' => 10,
	];

	$response = wp_remote_post($url, $args);

	if (is_wp_error($response)) {
		error_log('[UD Reservation] ❌ Ably-Event fehlgeschlagen: ' . $response->get_error_message());
		return;
	}

	$code = wp_remote_retrieve_response_code($response);
	if ($code === 201) {
		error_log("[UD Reservation] ✅ Ably-Event '{$event_type}' erfolgreich gesendet (Post ID {$post_id})");
	} else {
		$body = wp_remote_retrieve_body($response);
		error_log("[UD Reservation] ⚠️ Ably-Event '{$event_type}' unerwarteter Statuscode: {$code}, Antwort: {$body}");
	}
}

/**
 * 🧩 Reservationen
 */
add_action('save_post_ud_reservation', function ($post_id, $post, $update) {
	if (defined('DOING_AUTOSAVE') && DOING_AUTOSAVE) return;
	if (wp_is_post_revision($post_id)) return;

	$event = $update ? 'reservation_update' : 'reservation_create';
	ud_reservation_publish_ably_event($event, $post_id);
}, 10, 3);

add_action('before_delete_post', function ($post_id) {
	$post = get_post($post_id);
	if ($post && $post->post_type === 'ud_reservation') {
		ud_reservation_publish_ably_event('reservation_delete', $post_id);
	}
});

/**
 * 🧩 Ausverkaufte Tage
 */
add_action('save_post_ud_soldout', function ($post_id, $post, $update) {
	if (defined('DOING_AUTOSAVE') && DOING_AUTOSAVE) return;
	if (wp_is_post_revision($post_id)) return;

	ud_reservation_publish_ably_event('soldout_update', $post_id, [
		'date'   => $post->post_title,
		'status' => true,
	]);
}, 10, 3);

add_action('before_delete_post', function ($post_id) {
	$post = get_post($post_id);
	if (! $post || $post->post_type !== 'ud_soldout') {
		return;
	}

	ud_reservation_publish_ably_event('soldout_update', $post_id, [
		'date'    => $post->post_title,
		'status'  => false,
		'deleted' => true,
	]);
});

/**
 * 🔍 Debug: aktuellen Key beim Init loggen
 */
add_action('init', function () {
	$key = ud_reservation_get_ably_key();
	if ($key) {
		error_log('[UD Reservation] 🔑 Aktueller Ably-Key: ' . substr($key, 0, 12) . '...');
	}
});
