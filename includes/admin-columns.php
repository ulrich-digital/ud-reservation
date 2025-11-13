<?php
/* Datei: admin-columns.php */

/**
 * Zusätzliche Spalten und Schnellbearbeitung für Reservationen (ud_reservation)
 */

defined('ABSPATH') || exit;

// =====================================================
// Spalten in der Übersicht (CPT ud_reservation)
// =====================================================
add_filter('manage_ud_reservation_posts_columns', function ($columns) {
	unset($columns['date']); // Standard-Datum entfernen

	$new_columns = [
		'cb'                    => '<input type="checkbox" />',
		'title'                 => __('Name', 'ud-reservation-ud'),
		'reservation_phone'     => __('Telefonnummer', 'ud-reservation-ud'),
		'reservation_persons'   => __('Personen', 'ud-reservation-ud'),
		'reservation_menu'      => __('Menü-Zusatz', 'ud-reservation-ud'),
		'reservation_present'   => __('Anwesend', 'ud-reservation-ud'),
		'reservation_datetime'  => __('Datum & Uhrzeit', 'ud-reservation-ud'),
		'reservation_suppentag' => __('Suppentag', 'ud-reservation-ud'),
	];
	return $new_columns;
});

// =====================================================
// Spalteninhalte rendern (CPT ud_reservation)
// =====================================================
add_action('manage_ud_reservation_posts_custom_column', function ($column, $post_id) {
	$meta = get_post_meta($post_id);

	switch ($column) {
		case 'reservation_phone':
			echo esc_html($meta['reservation_phone'][0] ?? '–');
			break;

		case 'reservation_persons':
			echo esc_html($meta['reservation_persons'][0] ?? '–');
			break;

		case 'reservation_menu':
			echo esc_html($meta['reservation_menu'][0] ?? '–');
			break;

		case 'reservation_present':
			$present = !empty($meta['reservation_present'][0]) && $meta['reservation_present'][0] === '1';
			echo $present ? '✅' : '❌';
			break;

		case 'reservation_datetime':
			$datetime = $meta['reservation_datetime'][0] ?? '';
			if ($datetime) {
				$ts = strtotime($datetime);
				echo esc_html(date_i18n('d.m.Y H:i', $ts));
			} else {
				echo '–';
			}
			break;

		case 'reservation_suppentag':
			$suppentag_id = get_post_meta($post_id, 'suppentag_id', true);

			if ($suppentag_id) {
				$title = get_the_title($suppentag_id);
				$url   = get_edit_post_link($suppentag_id);
				if ($title && $url) {
					printf('<a href="%s">%s</a>', esc_url($url), esc_html($title));
				} else {
					echo '–';
				}
			} else {
				echo '–';
			}
			break;
	}
}, 10, 2);

// =====================================================
// Sortierbare Spalte „Datum & Uhrzeit“
// =====================================================
add_filter('manage_edit-ud_reservation_sortable_columns', function ($columns) {
	$columns['reservation_datetime'] = 'reservation_datetime';
	return $columns;
});

add_action('pre_get_posts', function ($query) {
	if (!is_admin() || !$query->is_main_query()) return;

	// 🕒 Sortierung nach Datum & Uhrzeit
	if ($query->get('orderby') === 'reservation_datetime') {
		$query->set('meta_key', 'reservation_datetime');
		$query->set('orderby', 'meta_value');
	}

	// 🔍 Filterung nach Suppentag (aus URL)
	if ($query->get('post_type') === 'ud_reservation' && isset($_GET['suppentag_id'])) {
		$suppentag_id = intval($_GET['suppentag_id']);
		if ($suppentag_id > 0) {
			$query->set('meta_query', [
				[
					'key'     => 'suppentag_id', // ✅ korrigiert
					'value'   => $suppentag_id,
					'compare' => '=',
				],
			]);
		}
	}
});

// =====================================================
// 🔽 Dropdown oben im Admin-Filterbereich (Suppentag-Auswahl)
// =====================================================
add_action('restrict_manage_posts', function ($post_type) {
	if ($post_type !== 'ud_reservation') return;

	$current = isset($_GET['suppentag_id']) ? intval($_GET['suppentag_id']) : 0;

	$suppentage = get_posts([
		'post_type'      => 'ud_suppentag',
		'post_status'    => 'publish',
		'posts_per_page' => -1,
		'meta_key'       => 'suppentag_date',
		'orderby'        => 'meta_value',
		'order'          => 'DESC',
	]);

	echo '<select name="suppentag_id" id="filter-by-suppentag" style="max-width:220px;">';
	echo '<option value="">– Alle Suppentage –</option>';

	foreach ($suppentage as $tag) {
		$date = get_post_meta($tag->ID, 'suppentag_date', true);
		$label = get_the_title($tag->ID);
		if ($date) {
			$label .= ' (' . esc_html($date) . ')';
		}
		printf(
			'<option value="%d" %s>%s</option>',
			$tag->ID,
			selected($current, $tag->ID, false),
			esc_html($label)
		);
	}

	echo '</select>';
});

// =====================================================
// Schnellbearbeitung – Eingabefelder
// =====================================================
add_action('quick_edit_custom_box', function ($column_name, $post_type) {
	if ($post_type !== 'ud_reservation') return;
	if ($column_name !== 'reservation_datetime') return;
?>
	<fieldset class="inline-edit-col-full" style="margin-top:1em; border-top:1px solid #ddd; padding-top:1em;">
		<legend style="font-weight:600; margin-bottom:5px;"><?php _e('Reservationdetails', 'ud-reservation-ud'); ?></legend>
		<div class="inline-edit-col wp-clearfix" style="display:grid; grid-template-columns:repeat(auto-fit,minmax(200px,1fr)); gap:1em;">
			<label><span class="title"><?php _e('Telefonnummer', 'ud-reservation-ud'); ?></span><input type="text" name="reservation_phone" value=""></label>
			<label><span class="title"><?php _e('Personen', 'ud-reservation-ud'); ?></span><input type="number" name="reservation_persons" min="1" value=""></label>
			<label><span class="title"><?php _e('Menü-Zusatz', 'ud-reservation-ud'); ?></span><input type="text" name="reservation_menu" value=""></label>
			<label><span class="title"><?php _e('Datum & Uhrzeit', 'ud-reservation-ud'); ?></span><input type="datetime-local" name="reservation_datetime" value=""></label>
			<label style="display:flex;align-items:center;gap:6px;"><input type="checkbox" name="reservation_present" value="1"><span class="checkbox-title"><?php _e('Anwesend', 'ud-reservation-ud'); ?></span></label>
		</div>
	</fieldset>
<?php
}, 10, 2);

// =====================================================
// Schnellbearbeitung – Felder automatisch befüllen
// =====================================================
add_action('admin_footer-edit.php', function () {
	$screen = get_current_screen();
	if ($screen->post_type !== 'ud_reservation') return;
?>
	<script>
		jQuery(function($) {
			$('#the-list').on('click', '.editinline', function() {
				const id = $(this).closest('tr').attr('id').replace('post-', '');
				const $edit = $('#edit-' + id);

				const phone = $(`#post-${id} .column-reservation_phone`).text().trim();
				const persons = $(`#post-${id} .column-reservation_persons`).text().trim();
				const menu = $(`#post-${id} .column-reservation_menu`).text().trim();
				const present = $(`#post-${id} .column-reservation_present`).text().includes('✅');
				const datetimeText = $(`#post-${id} .column-reservation_datetime`).text().trim();

				$edit.find('[name="reservation_phone"]').val(phone);
				$edit.find('[name="reservation_persons"]').val(persons);
				$edit.find('[name="reservation_menu"]').val(menu);
				$edit.find('[name="reservation_present"]').prop('checked', present);

				if (datetimeText.match(/(\d{2})\.(\d{2})\.(\d{4})\s+(\d{2}:\d{2})/)) {
					const p = datetimeText.match(/(\d{2})\.(\d{2})\.(\d{4})\s+(\d{2}:\d{2})/);
					$edit.find('[name="reservation_datetime"]').val(`${p[3]}-${p[2]}-${p[1]}T${p[4]}`);
				}
			});
		});
	</script>
<?php
});

// =====================================================
// Schnellbearbeitung speichern (AJAX)
// =====================================================
add_action('wp_ajax_ud_reservation_quick_save', function () {
	check_ajax_referer('ud_reservation_quick_save', 'nonce');
	$post_id = intval($_POST['post_id'] ?? 0);
	if (!$post_id || !current_user_can('edit_post', $post_id)) {
		wp_send_json_error('Keine Berechtigung.');
	}
	foreach (['reservation_phone', 'reservation_persons', 'reservation_menu', 'reservation_present', 'reservation_datetime'] as $field) {
		if (isset($_POST[$field])) update_post_meta($post_id, $field, sanitize_text_field($_POST[$field]));
	}
	wp_send_json_success('Gespeichert');
});

// =====================================================
// Zusätzliche Spalten im CPT "Suppentage"
// =====================================================
add_filter('manage_ud_suppentag_posts_columns', function ($columns) {
	$new = [];
	foreach ($columns as $key => $label) {
		$new[$key] = $label;
		if ($key === 'title') {
			$new['suppentag_reservations'] = __('Reservationen', 'ud-reservation-ud');
			$new['suppentag_reinigung']    = __('Reinigung', 'ud-reservation-ud');
		}
	}
	return $new;
});

// =====================================================
// Spalteninhalte rendern: Reservationen + Reinigung
// =====================================================
add_action('manage_ud_suppentag_posts_custom_column', function ($column, $post_id) {

	// 🔹 Reservationen
	if ($column === 'suppentag_reservations') {
		$reservations = get_posts([
			'post_type'      => 'ud_reservation',
			'post_status'    => 'publish',
			'posts_per_page' => -1,
			'meta_query'     => [['key' => 'suppentag_id', 'value' => $post_id]], // ✅ korrigiert
		]);

		if (empty($reservations)) {
			echo '<span style="color:#999;font-style:italic;">Keine Reservationen</span>';
			return;
		}

		$filter_url = admin_url('edit.php?post_type=ud_reservation&suppentag_id=' . $post_id);
		printf('<div style="margin-bottom:4px;"><a href="%s" style="font-weight:600;color:#0073aa;">Alle Reservationen anzeigen</a></div>', esc_url($filter_url));

		echo '<ul style="margin:0;padding-left:1em;list-style:disc;">';
		foreach ($reservations as $r) {
			$title = get_the_title($r->ID);
			printf('<li><a href="%s" style="color:#0073aa;">%s</a></li>', esc_url(admin_url('edit.php?post_type=ud_reservation&highlight_id=' . $r->ID)), esc_html($title));
		}
		echo '</ul>';
	}

	// 🔹 Reinigung
	if ($column === 'suppentag_reinigung') {
		$reinigung = get_posts([
			'post_type'      => 'ud_reinigung',
			'post_status'    => ['publish', 'draft', 'pending'],
			'posts_per_page' => 1,
			'meta_query'     => [['key' => 'reinigung_suppentag_id', 'value' => $post_id]], // ✅ korrigiert
		]);

		if (empty($reinigung)) {
			echo '<span style="color:#999;font-style:italic;">Keine Reinigung</span>';
			return;
		}

		$r = $reinigung[0];
		$edit_url = get_edit_post_link($r->ID);
		$title = get_the_title($r->ID) ?: 'Ohne Titel';
		$status = get_post_status_object($r->post_status)->label ?? '';

		printf(
			'<a href="%s" style="font-weight:600;color:#0073aa;">%s</a><br><span style="color:#888;font-size:12px;">%s</span>',
			esc_url($edit_url),
			esc_html($title),
			esc_html($status)
		);
	}
}, 10, 2);

// =====================================================
// Optional: Hervorhebung beim Highlight-Link
// =====================================================
add_action('admin_footer-edit.php', function () {
	$screen = get_current_screen();
	if ($screen->post_type !== 'ud_reservation') return;
	if (!isset($_GET['highlight_id'])) return;
	$highlight_id = intval($_GET['highlight_id']);
?>
	<script>
		jQuery(function($) {
			const id = <?php echo $highlight_id; ?>;
			const $row = $('#post-' + id);
			if ($row.length) {
				$row.css('background-color', '#fff6d1');
				$('html,body').animate({
					scrollTop: $row.offset().top - 150
				}, 400);
			}
		});
	</script>
<?php
});


/**
 * 🧾 UD Reservation – Nur Schnellbearbeitung im Admin erlauben
 */
add_filter('post_row_actions', function ($actions, $post) {
	if ($post->post_type === 'ud_reservation') {
		// Nur "Quick Edit" behalten
		$allowed = ['inline hide-if-no-js'];
		return array_filter($actions, function ($key) use ($allowed) {
			return in_array($key, $allowed, true);
		}, ARRAY_FILTER_USE_KEY);
	}
	return $actions;
}, 10, 2);

/**
 * 🔒 Deaktiviert die Linkfunktion des Titels (kein Klick → Edit-Screen)
 */
add_filter('get_edit_post_link', function ($link, $post_id) {
	$post = get_post($post_id);
	if ($post && $post->post_type === 'ud_reservation') {
		return ''; // kein Link → Titel bleibt Text
	}
	return $link;
}, 10, 2);


