<?php
// =====================================================
// 🧩 Backend Toggle-Button „Ausverkauft“ für ud_suppentag
// =====================================================

// 1️⃣ Metabox hinzufügen (rechts, im Editor)
add_action('add_meta_boxes', function () {
	add_meta_box(
		'ud_soldout_toggle',
		__('Status: Ausverkauft', 'ud-reservation-ud'),
		'ud_soldout_toggle_meta_box',
		'ud_suppentag',
		'side',
		'high'
	);
});

function ud_soldout_toggle_meta_box(WP_Post $post) {
	$meta_val   = get_post_meta($post->ID, 'suppentag_soldout', true);
	$is_active  = in_array($meta_val, [1, '1', true, 'true'], true);
	$label      = $is_active ? '🟢 Aktuell AUSVERKAUFT' : '⚪ Nicht ausverkauft';
	$button_txt = $is_active ? 'Ausverkauft deaktivieren' : 'Ausverkauft aktivieren';

	wp_nonce_field('ud_soldout_toggle_nonce', 'ud_soldout_toggle_nonce_field');
	?>
	<p><strong><?php echo esc_html($label); ?></strong></p>
	<p>
		<button type="button"
			class="button button-primary"
			id="ud-soldout-toggle-button"
			data-post-id="<?php echo esc_attr($post->ID); ?>">
			<?php echo esc_html($button_txt); ?>
		</button>
	</p>
	<script>
		document.addEventListener("DOMContentLoaded", () => {
			const btn = document.getElementById("ud-soldout-toggle-button");
			if (!btn) return;

			btn.addEventListener("click", async () => {
				btn.disabled = true;
				const originalText = btn.textContent;
				btn.textContent = "Wird gespeichert…";

				const postId = btn.dataset.postId;
				const nonceEl = document.getElementById("ud_soldout_toggle_nonce_field");
				const nonce = nonceEl ? nonceEl.value : "";

				try {
					const res = await fetch(ajaxurl, {
						method: "POST",
						headers: { "Content-Type": "application/x-www-form-urlencoded" },
						body: new URLSearchParams({
							action: "ud_toggle_soldout_status",
							post_id: postId,
							nonce
						})
					});
					const data = await res.json();

					if (data.success) {
						const isActive = data.data.new_status === 1;
						btn.textContent = isActive
							? "Ausverkauft deaktivieren"
							: "Ausverkauft aktivieren";

						const strongEl = btn.closest(".inside").querySelector("strong");
						if (strongEl)
							strongEl.textContent = isActive
								? "🟢 Aktuell AUSVERKAUFT"
								: "⚪ Nicht ausverkauft";

						btn.disabled = false;
					} else {
						alert("Fehler: " + (data.data?.message || "Unbekannter Fehler"));
						btn.disabled = false;
						btn.textContent = originalText;
					}
				} catch (e) {
					alert("Netzwerkfehler");
					btn.disabled = false;
					btn.textContent = originalText;
				}
			});
		});
	</script>
	<?php
}

// 2️⃣ AJAX-Handler
add_action('wp_ajax_ud_toggle_soldout_status', function () {
	check_ajax_referer('ud_soldout_toggle_nonce', 'nonce'); 
	// ✅ CSRF-Schutz aktiv – korrekt.

	$post_id = intval($_POST['post_id'] ?? 0);
	if (!$post_id || get_post_type($post_id) !== 'ud_suppentag') {
		wp_send_json_error(['message' => 'Ungültiger Beitrag.']);
	}
	// ✅ saubere Validierung auf CPT-Typ.

	if (!current_user_can('edit_post', $post_id)) {
		wp_send_json_error(['message' => 'Keine Berechtigung.']);
	}
	// ✅ Berechtigungsprüfung korrekt.

	$current_meta = get_post_meta($post_id, 'suppentag_soldout', true);
	$current      = in_array($current_meta, [1, '1', true, 'true'], true);
	$new_status   = $current ? 0 : 1;
	// ✅ robust gegen falsche Typen (string/bool/int) – sehr gut.

	update_post_meta($post_id, 'suppentag_soldout', $new_status);
	// ✅ speichert bool-Wert als 0/1 – konsistent mit REST-API.

	// 🔄 Echtzeit-Event über Ably senden (wie im REST-Handler)
	if (function_exists('ud_reservation_send_ably_event')) {
		// 🔹 sauberes ISO-Datum (z. B. 2025-10-28)
		$date_iso = get_post_meta($post_id, 'suppentag_date', true);

		ud_reservation_send_ably_event('soldout_update', [
			'date'   => $date_iso ?: get_the_title($post_id),
			'status' => (bool) $new_status,
			'source' => 'admin_toggle',
			'time'   => current_time('mysql'),
		]);
	}
	// ✅ sendet exakt das erwartete Format an den Frontend-Listener.
	//    (Frontend prüft: if (date === datePicker.value))

	wp_send_json_success(['new_status' => (int) $new_status]);
	// ✅ Rückgabe als Integer → einfach im JS auswertbar.
});
