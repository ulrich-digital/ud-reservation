<?php
// =====================================================
// Admin-Übersicht für Reservationen + Filter + CSV-Export
// =====================================================

add_action('admin_menu', function() {
	add_submenu_page(
		'edit.php?post_type=ud_reservation',
		__('Übersicht', 'ud-reservation-ud'),
		__('Übersicht', 'ud-reservation-ud'),
		'edit_posts',
		'ud_reservation_admin',
		'ud_reservation_admin_page'
	);
});

function ud_reservation_admin_page() {
	if ( ! current_user_can('edit_posts') ) {
		wp_die(__('Keine Berechtigung.', 'ud-reservation-ud'));
	}

	// ======= Filterwerte auslesen =======
	$filter_date = isset($_GET['filter_date']) ? sanitize_text_field($_GET['filter_date']) : '';
	$filter_user = isset($_GET['filter_user']) ? absint($_GET['filter_user']) : 0;

	// ======= CSV-Link vorbereiten =======
	$export_args = [
		'action' => 'ud_reservation_export_csv',
		'_wpnonce' => wp_create_nonce('ud_reservation_export_csv'),
	];
	if ($filter_date) $export_args['filter_date'] = $filter_date;
	if ($filter_user) $export_args['filter_user'] = $filter_user;

	$export_url = add_query_arg($export_args, admin_url('edit.php?post_type=ud_reservation&page=ud_reservation_admin'));

	// ======= Filterformular =======
	echo '<div class="wrap">';
	echo '<h1>' . esc_html__('Reservationen Übersicht', 'ud-reservation-ud') . '</h1>';

	echo '<form method="get" action="">';
	echo '<input type="hidden" name="post_type" value="ud_reservation" />';
	echo '<input type="hidden" name="page" value="ud_reservation_admin" />';
	echo '<table class="form-table"><tbody><tr>';
	echo '<th scope="row">Datum</th>';
	echo '<td><input type="date" name="filter_date" value="' . esc_attr($filter_date) . '" /></td>';
	echo '</tr><tr>';
	echo '<th scope="row">Benutzer</th>';
	echo '<td><select name="filter_user"><option value="0">Alle Benutzer</option>';

	$users = get_users(['who' => 'authors']);
	foreach ($users as $u) {
		printf(
			'<option value="%d" %s>%s</option>',
			$u->ID,
			selected($filter_user, $u->ID, false),
			esc_html($u->display_name)
		);
	}

	echo '</select></td></tr></tbody></table>';
	submit_button(__('Filtern', 'ud-reservation-ud'));
	echo '</form>';

	echo '<p><a href="' . esc_url($export_url) . '" class="button button-primary">' . esc_html__('CSV exportieren', 'ud-reservation-ud') . '</a></p>';

	// ======= Daten abrufen =======
	$meta_query = [];
	if ($filter_date) {
		$meta_query[] = [
			'key' => 'reservation_date',
			'value' => $filter_date,
			'compare' => '='
		];
	}

	$args = [
		'post_type'      => 'ud_reservation',
		'posts_per_page' => -1,
		'post_status'    => 'any',
		'orderby'        => 'date',
		'order'          => 'DESC',
		'meta_query'     => $meta_query
	];
	if ($filter_user) {
		$args['author'] = $filter_user;
	}

	$reservations = get_posts($args);

	// ======= Tabelle =======
	echo '<table class="widefat fixed striped">';
	echo '<thead><tr>';
	echo '<th>' . esc_html__('Datum', 'ud-reservation-ud') . '</th>';
	echo '<th>' . esc_html__('Titel', 'ud-reservation-ud') . '</th>';
	echo '<th>' . esc_html__('Personen', 'ud-reservation-ud') . '</th>';
	echo '<th>' . esc_html__('Menü', 'ud-reservation-ud') . '</th>';
	echo '<th>' . esc_html__('Status', 'ud-reservation-ud') . '</th>';
	echo '<th>' . esc_html__('Erstellt von', 'ud-reservation-ud') . '</th>';
	echo '</tr></thead><tbody>';

	if ( $reservations ) {
		foreach ( $reservations as $r ) {
			$date    = get_post_meta($r->ID, 'reservation_date', true);
			$persons = get_post_meta($r->ID, 'reservation_persons', true);
			$meal    = get_post_meta($r->ID, 'reservation_meal', true);
			$status  = get_post_meta($r->ID, 'reservation_status', true);
			$author  = get_userdata($r->post_author);
			$user    = $author ? $author->display_name : '—';

			echo '<tr>';
			echo '<td>' . esc_html($date ?: '—') . '</td>';
			echo '<td><a href="' . get_edit_post_link($r->ID) . '">' . esc_html($r->post_title) . '</a></td>';
			echo '<td>' . esc_html($persons ?: '—') . '</td>';
			echo '<td>' . esc_html($meal ?: '—') . '</td>';
			echo '<td>' . esc_html($status ?: '—') . '</td>';
			echo '<td>' . esc_html($user) . '</td>';
			echo '</tr>';
		}
	} else {
		echo '<tr><td colspan="6">' . esc_html__('Keine Reservationen gefunden.', 'ud-reservation-ud') . '</td></tr>';
	}

	echo '</tbody></table>';
	echo '</div>';
}

// =====================================================
// CSV-Export mit Filterunterstützung
// =====================================================

add_action('admin_init', function() {
	if (
		isset($_GET['action']) &&
		$_GET['action'] === 'ud_reservation_export_csv' &&
		current_user_can('edit_posts') &&
		wp_verify_nonce($_GET['_wpnonce'] ?? '', 'ud_reservation_export_csv')
	) {
		$filter_date = isset($_GET['filter_date']) ? sanitize_text_field($_GET['filter_date']) : '';
		$filter_user = isset($_GET['filter_user']) ? absint($_GET['filter_user']) : 0;

		$meta_query = [];
		if ($filter_date) {
			$meta_query[] = [
				'key' => 'reservation_date',
				'value' => $filter_date,
				'compare' => '='
			];
		}

		$args = [
			'post_type'      => 'ud_reservation',
			'posts_per_page' => -1,
			'post_status'    => 'any',
			'orderby'        => 'date',
			'order'          => 'DESC',
			'meta_query'     => $meta_query
		];
		if ($filter_user) {
			$args['author'] = $filter_user;
		}

		$reservations = get_posts($args);

		header('Content-Type: text/csv; charset=utf-8');
		header('Content-Disposition: attachment; filename=reservationen_' . date('Y-m-d_H-i') . '.csv');

		$output = fopen('php://output', 'w');
		fputcsv($output, ['Datum', 'Titel', 'Personen', 'Menü', 'Status', 'Erstellt von']);

		foreach ( $reservations as $r ) {
			$date    = get_post_meta($r->ID, 'reservation_date', true);
			$persons = get_post_meta($r->ID, 'reservation_persons', true);
			$meal    = get_post_meta($r->ID, 'reservation_meal', true);
			$status  = get_post_meta($r->ID, 'reservation_status', true);
			$author  = get_userdata($r->post_author);
			$user    = $author ? $author->display_name : '';

			fputcsv($output, [
				$date,
				$r->post_title,
				$persons,
				$meal,
				$status,
				$user
			]);
		}

		fclose($output);
		exit;
	}
});
