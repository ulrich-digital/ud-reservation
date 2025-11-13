<?php
/* Datei: meta-box-suppentag.php */

/**
 * Meta-Boxen für CPT "Suppentag"
 * (Datum, Reservationen, Reinigung, Statistik Produktion & Verkauf, Soldout)
 */

defined('ABSPATH') || exit;

// =======================================================
// 🧹 Alte doppelte Meta-Boxen entfernen
// =======================================================
add_action('do_meta_boxes', function () {
	remove_meta_box('ud_produktionsdaten_box', 'ud_suppentag', 'normal');
	remove_meta_box('ud_produktionsdaten_box', 'ud_suppentag', 'advanced');
	remove_meta_box('ud_produktionsdaten_box', 'ud_suppentag', 'side');
});

// =======================================================
// 🔹 Meta-Boxen registrieren
// =======================================================
add_action('add_meta_boxes_ud_suppentag', function () {

	// 🗓 Suppentag-Datum
	add_meta_box(
		'ud_suppentag_date_box',
		'Suppentag-Datum',
		'ud_suppentag_render_date_box',
		'ud_suppentag',
		'normal',
		'high'
	);

	// 🧾 Reservationen
	add_meta_box(
		'ud_suppentag_reservations_box',
		'Reservationen an diesem Tag',
		'ud_suppentag_render_reservations_box',
		'ud_suppentag',
		'normal',
		'default'
	);

	// 🧹 Reinigung (nur Link)
	add_meta_box(
		'ud_suppentag_reinigung_box',
		'Reinigung',
		'ud_suppentag_render_reinigung_box',
		'ud_suppentag',
		'normal',
		'default'
	);

	// 📊 Statistik Produktion & Verkauf
	add_meta_box(
		'ud_suppentag_produktionsdaten_box',
		'Statistik Produktion & Verkauf',
		'ud_suppentag_render_produktionsdaten_box',
		'ud_suppentag',
		'normal',
		'default'
	);

	// 🟢 Soldout Toggle (rechte Sidebar)
	add_meta_box(
		'ud_soldout_toggle',
		__('Status: Ausverkauft', 'ud-reservation-ud'),
		'ud_soldout_toggle_meta_box',
		'ud_suppentag',
		'normal', // statt 'side'
		'high'
	);

	// 🍲 Verpflegung
	add_meta_box(
		'ud_suppentag_verpflegung_box',
		'Statistik Suppenabgabe',
		'ud_suppentag_render_verpflegung_box',
		'ud_suppentag',
		'normal',
		'default'
	);
});


// =======================================================
// 🗓 Suppentag-Datum
// =======================================================
function ud_suppentag_render_date_box($post)
{
	wp_nonce_field('ud_suppentag_date_save', 'ud_suppentag_date_nonce');
	$date = get_post_meta($post->ID, 'suppentag_date', true) ?: '';

	echo '<p><label for="suppentag_date"><strong>Datum wählen:</strong></label><br>';
	echo '<input type="date" id="suppentag_date" name="suppentag_date" value="' . esc_attr($date) . '" style="width:200px;padding:4px;"></p>';
}


// =======================================================
// 🧾 Reservationen
// =======================================================
function ud_suppentag_render_reservations_box($post)
{

	error_log('🧩 [DEBUG] ud_suppentag_render_reservations_box() gestartet – Post-ID: ' . $post->ID);
	$reservations = get_posts([
		'post_type'      => 'ud_reservation',
		'post_status'    => 'publish',
		'posts_per_page' => -1,
		'meta_query'     => [[
			'key'   => 'suppentag_id',
			'value' => $post->ID,
		]],
		'orderby' => 'title',
		'order'   => 'ASC'
	]);

	if (empty($reservations)) {
		echo '<p style="color:#999;">Keine Reservationen vorhanden.</p>';
		return;
	}

	echo '<ul style="margin:0;padding-left:1.2em;list-style:disc;">';
	foreach ($reservations as $r) {
		$link = admin_url('edit.php?post_type=ud_reservation&highlight_id=' . $r->ID);
		printf('<li><a href="%s">%s</a></li>', esc_url($link), esc_html($r->post_title));
	}
	echo '</ul>';
}

// =======================================================
// 🧹 Reinigung (nur Link, kein Button)
// =======================================================
function ud_suppentag_render_reinigung_box($post) {
	$reinigung = get_posts([
		'post_type'      => 'reinigung', // ✅ korrekter CPT
		'post_status'    => ['publish', 'draft', 'pending'],
		'posts_per_page' => 1,
		'meta_query'     => [[
			'key'     => 'reinigung_suppentag_id',
			'value'   => $post->ID,
			'compare' => '=',
		]],
	]);

	if (empty($reinigung)) {
		echo '<p style="color:#999;">Keine Reinigung mit diesem Suppentag verknüpft.</p>';
		return;
	}

	$r = $reinigung[0];
	$edit_url = get_edit_post_link($r->ID);
	$title = get_the_title($r->ID) ?: 'Ohne Titel';
	$status_obj = get_post_status_object($r->post_status);
	$status_label = $status_obj ? $status_obj->label : '';

	printf(
		'<p><a href="%s" style="font-weight:600;color:#0073aa;">%s</a><br><span style="color:#888;font-size:12px;">Status: %s</span></p>',
		esc_url($edit_url),
		esc_html($title),
		esc_html($status_label)
	);
}

// =======================================================
// 📊 Statistik Produktion & Verkauf
// =======================================================
function ud_suppentag_render_produktionsdaten_box($post)
{
	wp_nonce_field('ud_produktionsdaten_save', 'ud_produktionsdaten_nonce');

	$produktion_gesamt = get_post_meta($post->ID, 'produktion_gesamt', true) ?: 0;
	$lieferanten = get_post_meta($post->ID, 'suppentag_produktion', true);
	if (!is_array($lieferanten)) $lieferanten = [];

	echo '
	<style>
		.ud-admin-tabelle {
			width: 100%;
			border-collapse: collapse;
			margin-top: 0.5rem;
		}
		.ud-admin-tabelle th,
		.ud-admin-tabelle td {
			padding: 6px 8px;
			border-bottom: 1px solid #ddd;
		}
		.ud-admin-tabelle th {
			background: #f9f9f9;
			text-align: left;
		}
		.ud-admin-tabelle input[type="text"],
		.ud-admin-tabelle input[type="number"] {
			width: 100%;
			padding: 3px 5px;
		}
	</style>

	<p>
		<label for="produktion_gesamt"><strong>Gesamtproduktion (l):</strong></label><br>
		<input type="number" step="0.1" id="produktion_gesamt" name="produktion_gesamt" value="' . esc_attr($produktion_gesamt) . '" min="0">
	</p>

	<table class="ud-admin-tabelle">
		<thead>
			<tr>
				<th>Lieferant</th>
				<th>Lieferung (l)</th>
				<th>Retouren (l)</th>
				<th>Verkauf (l)</th>
				<th></th>
			</tr>
		</thead>
		<tbody id="ud-produktionsdaten-body">';

	if (!empty($lieferanten)) {
		foreach ($lieferanten as $i => $entry) {
			$name      = esc_attr($entry['name'] ?? '');
			$lieferung = esc_attr($entry['lieferung'] ?? 0);
			$retouren  = esc_attr($entry['retouren'] ?? 0);
			$verkauf   = esc_attr($entry['verkauf'] ?? 0);

			echo "<tr>
				<td><input type='text' name='suppentag_produktion[{$i}][name]' value='{$name}'></td>
				<td><input type='number' step='0.1' name='suppentag_produktion[{$i}][lieferung]' value='{$lieferung}'></td>
				<td><input type='number' step='0.1' name='suppentag_produktion[{$i}][retouren]' value='{$retouren}'></td>
				<td><input type='number' step='0.1' name='suppentag_produktion[{$i}][verkauf]' value='{$verkauf}'></td>
				<td><button type='button' class='button remove'>–</button></td>
			</tr>";
		}
	} else {
		echo "<tr><td colspan='5'>Noch keine Lieferanten erfasst.</td></tr>";
	}

	echo '</tbody>
		<tfoot>
			<tr>
				<td><strong>Total</strong></td>
				<td></td>
				<td class="total-retouren"><strong>0.0 l</strong></td>
				<td class="total-verkauf"><strong>0.0 l</strong></td>
				<td></td>
			</tr>
		</tfoot>
	</table>

	<p>
		<button type="button" class="button" id="ud-produktionsdaten-add">+ Lieferant hinzufügen</button>
	</p>

	<script>
	const tableBody = document.getElementById("ud-produktionsdaten-body");

	document.getElementById("ud-produktionsdaten-add")?.addEventListener("click", () => {
		const index = tableBody.querySelectorAll("tr").length;
		const row = document.createElement("tr");
		row.innerHTML = `
			<td><input type="text" name="suppentag_produktion[\${index}][name]" value=""></td>
			<td><input type="number" step="0.1" name="suppentag_produktion[\${index}][lieferung]" value="0"></td>
			<td><input type="number" step="0.1" name="suppentag_produktion[\${index}][retouren]" value="0"></td>
			<td><input type="number" step="0.1" name="suppentag_produktion[\${index}][verkauf]" value="0"></td>
			<td><button type="button" class="button remove">–</button></td>
		`;
		tableBody.appendChild(row);
		updateTotals();
	});

	tableBody.addEventListener("click", (e) => {
		if (e.target.classList.contains("remove")) {
			e.target.closest("tr").remove();
			updateTotals();
		}
	});

	document.addEventListener("input", (e) => {
		if (["lieferung","retouren","verkauf"].some(k => e.target.name?.includes(k))) {
			updateTotals();
		}
	});

	function updateTotals() {
		let totalRetouren = 0;
		let totalVerkauf = 0;
		document.querySelectorAll("input[name*=\"[retouren]\"]").forEach(el => totalRetouren += parseFloat(el.value) || 0);
		document.querySelectorAll("input[name*=\"[verkauf]\"]").forEach(el => totalVerkauf += parseFloat(el.value) || 0);
		document.querySelector(".total-retouren strong").textContent = totalRetouren.toFixed(1) + " l";
		document.querySelector(".total-verkauf strong").textContent = totalVerkauf.toFixed(1) + " l";
	}

	updateTotals();
	</script>';
}

// =======================================================
// 🍲 Verpflegung – Znüni / Mittag (Kinder + Erwachsene)
// =======================================================
function ud_suppentag_render_verpflegung_box($post)
{
	wp_nonce_field('ud_suppentag_verpflegung_save', 'ud_suppentag_verpflegung_nonce');

	$znKinder = get_post_meta($post->ID, 'suppentag_znüni_kinder', true);
	$znErw    = get_post_meta($post->ID, 'suppentag_znüni_erwachsene', true);
	$miKinder = get_post_meta($post->ID, 'suppentag_mittag_kinder', true);
	$miErw    = get_post_meta($post->ID, 'suppentag_mittag_erwachsene', true);

	echo '<table class="form-table" style="width:auto">
		<tr>
			<th><label for="suppentag_znüni_kinder">Znüni – Kinder</label></th>
			<td><input type="number" id="suppentag_znüni_kinder" name="suppentag_znüni_kinder" value="' . esc_attr($znKinder) . '" min="0" style="width:80px;"></td>
		</tr>
		<tr>
			<th><label for="suppentag_znüni_erwachsene">Znüni – Erwachsene</label></th>
			<td><input type="number" id="suppentag_znüni_erwachsene" name="suppentag_znüni_erwachsene" value="' . esc_attr($znErw) . '" min="0" style="width:80px;"></td>
		</tr>
		<tr>
			<th><label for="suppentag_mittag_kinder">Mittag – Kinder</label></th>
			<td><input type="number" id="suppentag_mittag_kinder" name="suppentag_mittag_kinder" value="' . esc_attr($miKinder) . '" min="0" style="width:80px;"></td>
		</tr>
		<tr>
			<th><label for="suppentag_mittag_erwachsene">Mittag – Erwachsene</label></th>
			<td><input type="number" id="suppentag_mittag_erwachsene" name="suppentag_mittag_erwachsene" value="' . esc_attr($miErw) . '" min="0" style="width:80px;"></td>
		</tr>
	</table>';
}




// =======================================================
// 💾 Speicherung aller Metadaten
// =======================================================
add_action('save_post_ud_suppentag', function ($post_id) {

	if (defined('DOING_AUTOSAVE') && DOING_AUTOSAVE) return;
	if (!current_user_can('edit_post', $post_id)) return;

	// 🗓 Datum speichern
	if (
		isset($_POST['ud_suppentag_date_nonce']) &&
		wp_verify_nonce($_POST['ud_suppentag_date_nonce'], 'ud_suppentag_date_save')
	) {
		update_post_meta($post_id, 'suppentag_date', sanitize_text_field($_POST['suppentag_date']));
	}

	// 📊 Produktion & Verkauf speichern
	if (
		isset($_POST['ud_produktionsdaten_nonce']) &&
		wp_verify_nonce($_POST['ud_produktionsdaten_nonce'], 'ud_produktionsdaten_save')
	) {

		update_post_meta($post_id, 'produktion_gesamt', floatval($_POST['produktion_gesamt'] ?? 0));

		$produktion = $_POST['suppentag_produktion'] ?? [];
		if (is_array($produktion)) {
			$produktion = array_values($produktion);
			update_post_meta($post_id, 'suppentag_produktion', $produktion);
		} else {
			delete_post_meta($post_id, 'suppentag_produktion');
		}
	}

	// 🍲 Verpflegung speichern
	if (
		isset($_POST['ud_suppentag_verpflegung_nonce']) &&
		wp_verify_nonce($_POST['ud_suppentag_verpflegung_nonce'], 'ud_suppentag_verpflegung_save')
	) {

		update_post_meta($post_id, 'suppentag_znüni_kinder',       intval($_POST['suppentag_znüni_kinder'] ?? 0));
		update_post_meta($post_id, 'suppentag_znüni_erwachsene',   intval($_POST['suppentag_znüni_erwachsene'] ?? 0));
		update_post_meta($post_id, 'suppentag_mittag_kinder',      intval($_POST['suppentag_mittag_kinder'] ?? 0));
		update_post_meta($post_id, 'suppentag_mittag_erwachsene',  intval($_POST['suppentag_mittag_erwachsene'] ?? 0));
	}
});


// =======================================================
// 🧩 Soldout Toggle-Box (AJAX + Meta)
// =======================================================
function ud_soldout_toggle_meta_box(WP_Post $post)
{
	$is_active   = (bool) get_post_meta($post->ID, 'suppentag_soldout', true);
	$label       = $is_active ? '🟢 Aktuell AUSVERKAUFT' : '⚪ Nicht ausverkauft';
	$button_text = $is_active ? 'Ausverkauft deaktivieren' : 'Ausverkauft aktivieren';

	wp_nonce_field('ud_soldout_toggle_nonce', 'ud_soldout_toggle_nonce_field');

	echo '<p><strong>' . esc_html($label) . '</strong></p>';
	echo '<p><button type="button" class="button button-primary" id="ud-soldout-toggle-button" data-post-id="' . esc_attr($post->ID) . '">' . esc_html($button_text) . '</button></p>';
?>
	<script>
		document.addEventListener('DOMContentLoaded', () => {
			const btn = document.getElementById('ud-soldout-toggle-button');
			if (!btn) return;

			btn.addEventListener('click', async () => {
				btn.disabled = true;
				const originalText = btn.textContent;
				btn.textContent = 'Wird gespeichert…';

				const postId = btn.dataset.postId;
				const nonceEl = document.getElementById('ud_soldout_toggle_nonce_field');
				const nonce = nonceEl ? nonceEl.value : '';

				try {
					const res = await fetch(ajaxurl, {
						method: 'POST',
						headers: {
							'Content-Type': 'application/x-www-form-urlencoded'
						},
						body: new URLSearchParams({
							action: 'ud_toggle_soldout_status',
							post_id: postId,
							nonce
						})
					});
					const data = await res.json();
					if (data.success) {
						const isActive = !!data.data.new_status;
						btn.textContent = isActive ? 'Ausverkauft deaktivieren' : 'Ausverkauft aktivieren';
						btn.closest('.inside').querySelector('strong').textContent =
							isActive ? '🟢 Aktuell AUSVERKAUFT' : '⚪ Nicht ausverkauft';
						btn.disabled = false;
					} else {
						alert('Fehler: ' + (data.data?.message || 'Unbekannter Fehler'));
						btn.disabled = false;
						btn.textContent = originalText;
					}
				} catch (e) {
					alert('Netzwerkfehler');
					btn.disabled = false;
					btn.textContent = originalText;
				}
			});
		});
	</script>
<?php
}

// =======================================================
// 🧩 AJAX-Handler Soldout
// =======================================================
add_action('wp_ajax_ud_toggle_soldout_status', function () {
	check_ajax_referer('ud_soldout_toggle_nonce', 'nonce');

	$post_id = intval($_POST['post_id'] ?? 0);
	if (!$post_id || get_post_type($post_id) !== 'ud_suppentag') {
		wp_send_json_error(['message' => 'Ungültiger Beitrag.']);
	}

	if (!current_user_can('edit_post', $post_id)) {
		wp_send_json_error(['message' => 'Keine Berechtigung.']);
	}

	$current    = (bool) get_post_meta($post_id, 'suppentag_soldout', true);
	$new_status = $current ? 0 : 1;

	update_post_meta($post_id, 'suppentag_soldout', $new_status);

	// Optional: Ably-Event
	if (function_exists('ud_reservation_send_ably_event')) {
		ud_reservation_send_ably_event('soldout_update', [
			'date'   => get_the_title($post_id),
			'status' => (bool) $new_status,
		]);
	}

	wp_send_json_success(['new_status' => (int) $new_status]);
});


// =======================================================
// 🧱 Klassischer Editor & Aufräumarbeiten
// =======================================================
add_filter('use_block_editor_for_post_type', fn($use, $type) => $type === 'ud_suppentag' ? false : $use, 10, 2);
add_action('init', fn() => remove_post_type_support('ud_suppentag', 'editor'));

add_action('do_meta_boxes', function () {
	remove_meta_box('postcustom', 'ud_suppentag', 'normal');
});
