<?php
/* Datei: ud-reservation.php */

/**
 * Plugin Name:     UD Reservation
 * Description:     Frontend-Reservierungen mit Benutzerzuordnung und Echtzeit-Aktualisierung über Ably.
 * Version:         1.4.0
 * Author:          ulrich.digital gmbh
 * Author URI:      https://ulrich.digital/
 * License:         GPL v2 or later
 * License URI:     https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:     ud-reservation-ud
 */

if (!defined('ABSPATH')) exit;

// ======================================================
// 🔧 Konstanten
// ======================================================
define('UD_RESERVATION_PATH', plugin_dir_path(__FILE__));
define('UD_RESERVATION_URL',  plugin_dir_url(__FILE__));
define('ABLY_API_KEY', 'xzrNUA.Bcq1Kw:objmvcZGq8X_XI9YA-ZHRUVXtbMzVHFnooRoaP46A84');

// ======================================================
// 🧱 Custom Post Type Reservation
// ======================================================
add_action('init', function () {
	register_post_type('ud_reservation', [
		'labels' => [
			'name'          => __('Reservationen', 'ud-reservation-ud'),
			'singular_name' => __('Reservation', 'ud-reservation-ud'),
		],
		'public'       => true,
		'show_in_rest' => true,
		'rest_base'    => 'ud-reservation',
		'supports'     => ['title', 'editor', 'custom-fields'],
		'menu_icon'    => 'dashicons-calendar-alt',
		'menu_position' => 22, // 🟢 direkt nach Suppentagen
	]);
});

// ======================================================
// 🍲 Custom Post Type Suppentag
// ======================================================
add_action('init', function () {
	register_post_type('ud_suppentag', [
		'labels' => [
			'name'          => __('Suppentage', 'ud-reservation-ud'),
			'singular_name' => __('Suppentag', 'ud-reservation-ud'),
		],
		'public'       => true,
		'show_in_rest' => true,
		'rest_base'    => 'ud-suppentag',
		'menu_icon'    => 'dashicons-food',
		// 'supports'     => ['title', 'editor', 'custom-fields'],
		'supports'     => ['title', 'custom-fields'],
		'has_archive'  => false,
		'menu_position' => 21, // 🟢 Suppentage zuerst
	]);
}, 5);

// ======================================================
// 🧩 Meta-Felder für Suppentag
// ======================================================

// 📅 Datum des Suppentags (Format: YYYY-MM-DD)
register_post_meta('ud_suppentag', 'suppentag_date', [
	'single'        => true,
	'type'          => 'string',
	'auth_callback' => fn() => current_user_can('edit_posts'),
	'show_in_rest'  => [
		'schema' => [
			'type'   => 'string',
			'format' => 'date',
		],
	],
]);

// 🟥 Ausverkauft-Status (ersetzt eigene SQL-Tabelle)
register_post_meta('ud_suppentag', 'suppentag_soldout', [
	'show_in_rest'  => true,
	'single'        => true,
	'type'          => 'boolean',
	'auth_callback' => fn() => current_user_can('edit_posts'),
]);

// 💧 Gesamtproduktion (in Litern)
register_post_meta('ud_suppentag', 'produktion_gesamt', [
	'show_in_rest'  => true,
	'single'        => true,
	'type'          => 'number',
	'auth_callback' => fn() => current_user_can('edit_posts'),
]);

// 🧾 Lieferanten-Daten (Array)
register_post_meta('ud_suppentag', 'suppentag_produktion', [
	'single'        => true,
	'type'          => 'array',
	'show_in_rest'  => [
		'schema' => [
			'type'  => 'array',
			'items' => [
				'type'       => 'object',
				'properties' => [
					'name' => [
						'type' => 'string',
					],
					'lieferung' => [
						'type' => 'number',
					],
					'retouren' => [
						'type' => 'number',
					],
					'verkauf' => [
						'type' => 'number',
					],
				],
			],
		],
	],
	'auth_callback' => fn() => current_user_can('edit_posts'),
]);

add_action('save_post_ud_suppentag', function ($post_id, $post, $update) {
	error_log('🧩 Suppentag gespeichert: ' . $post_id);
	error_log(print_r(get_post_meta($post_id), true));
}, 10, 3);


// ======================================================
// Custom REST-Route für exakte Suppentag-Suche per Datum
// ======================================================
add_action('rest_api_init', function () {
	register_rest_route('ud/v1', '/suppentag-by-date', [
		'methods'  => 'GET',
		'callback' => function (WP_REST_Request $request) {
			$date = sanitize_text_field($request->get_param('date'));
			if (empty($date)) {
				return new WP_Error(
					'missing_date',
					'Parameter "date" fehlt.',
					['status' => 400]
				);
			}

			// Exakte Abfrage – kein LIKE-Match
			$query = new WP_Query([
				'post_type'      => 'ud_suppentag',
				'post_status'    => ['publish', 'draft', 'pending'],
				'posts_per_page' => 1,
				'meta_query'     => [
					[
						'key'     => 'suppentag_date',
						'value'   => $date,
						'compare' => '=',
					],
				],
			]);

			if (!empty($query->posts)) {
				$post = $query->posts[0];
				return [
					'id'   => $post->ID,
					'title' => $post->post_title,
					'meta' => get_post_meta($post->ID),
				];
			}

			return ['id' => 0];
		},
		'permission_callback' => '__return_true',
	]);
});

// ======================================================
// 📊 Statistik Suppenabgabe (Kinder & Erwachsene)
// ======================================================
register_post_meta('ud_suppentag', 'suppentag_znüni_kinder', [
	'show_in_rest'  => true,
	'single'        => true,
	'type'          => 'string',
	'sanitize_callback' => function ($value) {
		if ($value === '' || $value === null) {
			return '';
		}
		return (string) (int) $value; // ✅ String zurückgeben, nicht Integer
	},
	'auth_callback' => fn() => current_user_can('edit_posts'),
]);

register_post_meta('ud_suppentag', 'suppentag_znüni_erwachsene', [
	'show_in_rest'  => true,
	'single'        => true,
	'type'          => 'string',
	'sanitize_callback' => function ($value) {
		if ($value === '' || $value === null) {
			return '';
		}
		return (string) (int) $value;
	},
	'auth_callback' => fn() => current_user_can('edit_posts'),
]);

register_post_meta('ud_suppentag', 'suppentag_mittag_kinder', [
	'show_in_rest'  => true,
	'single'        => true,
	'type'          => 'string',
	'sanitize_callback' => function ($value) {
		if ($value === '' || $value === null) {
			return '';
		}
		return (string) (int) $value;
	},
	'auth_callback' => fn() => current_user_can('edit_posts'),
]);

register_post_meta('ud_suppentag', 'suppentag_mittag_erwachsene', [
	'show_in_rest'  => true,
	'single'        => true,
	'type'          => 'string',
	'sanitize_callback' => function ($value) {
		if ($value === '' || $value === null) {
			return '';
		}
		return (string) (int) $value;
	},
	'auth_callback' => fn() => current_user_can('edit_posts'),
]);


// ======================================================
// 🔹 Shortcode für Verpflegung-Button + Modal
// ======================================================
add_shortcode('ud_verpflegung_button', function () {
	ob_start(); ?>
	<button id="ud-start-verpflegung" class="ud-verpflegung-button ud-button-bar-button">
		<div class="ud-verpflegung-progress-ring progress-ring">
			<svg viewBox="0 0 36 36">
				<circle class="bg" cx="18" cy="18" r="16"></circle>
				<circle class="progress" cx="18" cy="18" r="16"></circle>
			</svg>
		</div>
		<div class="ud-verpflegung-button-content button-content">
			<div class="label">Verpflegung</div>
			<div class="progress-text">0 von 4 erledigt</div>
		</div>
	</button>

	<!-- 🧩 Verpflegung Modal -->
	<div id="ud-verpflegung-modal" class="ud-modal" hidden>
		<div class="ud-modal-backdrop"></div>
		<div class="ud-modal-content">
			<button class="ud-modal-close" type="button"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M6.4 19L5 17.6L10.6 12L5 6.4L6.4 5L12 10.6L17.6 5L19 6.4L13.4 12L19 17.6L17.6 19L12 13.4L6.4 19Z" fill="#B2B2B2"/></svg>
</button>
			<div id="ud-verpflegung-loading">Wird geladen...</div>
			<div id="ud-verpflegung-form" hidden></div>
		</div>
	</div>
<?php
	return ob_get_clean();
});

// ======================================================
// 🧾 Lieferanten-Statistik (Produktion, Lieferung, Retouren, Verkauf)
// ======================================================
register_post_meta('ud_suppentag', 'suppentag_lieferanten', [
	'show_in_rest'  => true,
	'single'        => true,
	'type'          => 'object', // JSON-Struktur
	'default'       => [],
	'auth_callback' => fn() => current_user_can('edit_posts'),
]);

// ======================================================
// 🧠 Hilfsfunktion: Prüfen, ob Suppentag ausverkauft ist
// ======================================================
function ud_suppentag_is_soldout($suppentag_id)
{
	return (bool) get_post_meta($suppentag_id, 'suppentag_soldout', true);
}

// ======================================================
// 🍲 Öffentliche REST-Route für Tagessuppe (Kiosk)
// ======================================================
add_action('rest_api_init', function () {
	register_rest_route('ud-reservation/v1', '/soup', [
		'methods'             => 'GET',
		'callback'            => function () {
			$suppen = get_option('ud_suppentage', []);
			return rest_ensure_response($suppen);
		},
		'permission_callback' => '__return_true',
	]);
});

// ======================================================
// 🟥 REST-Route für Ausverkauft-Status (über CPT Suppentag)
// ======================================================
add_action('rest_api_init', function () {
	register_rest_route('ud-reservation/v1', '/soldout', [
		'methods'             => ['GET', 'POST'],
		'callback'            => 'ud_reservation_suppentag_soldout_rest',
		'permission_callback' => '__return_true',
	]);
});

function ud_reservation_suppentag_soldout_rest(WP_REST_Request $request)
{
	$date   = sanitize_text_field($request->get_param('date'));
	$method = $request->get_method();

	// 🔍 Finde den Suppentag anhand des Datums
	$suppentag = get_posts([
		'post_type'   => 'ud_suppentag',
		'meta_key'    => 'suppentag_date',
		'meta_value'  => $date,
		'numberposts' => 1,
	]);

	if (empty($suppentag)) {
		return rest_ensure_response([
			'date'       => $date,
			'is_soldout' => false,
			'found'      => false,
		]);
	}

	$suppentag_id = $suppentag[0]->ID;

	if ($method === 'POST') {
		$is_soldout = (bool) $request->get_param('is_soldout');
		update_post_meta($suppentag_id, 'suppentag_soldout', $is_soldout);

		return rest_ensure_response([
			'suppentag_id' => $suppentag_id,
			'date'         => $date,
			'is_soldout'   => $is_soldout,
			'updated'      => true,
		]);
	}

	// GET → aktuellen Status liefern (sauberer Cast)
	$meta_val = get_post_meta($suppentag_id, 'suppentag_soldout', true);

	// wenn Meta leer ist → 0
	if ($meta_val === '' || $meta_val === null) {
		$meta_val = 0;
	}

	$is_soldout = in_array($meta_val, [1, '1', true, 'true'], true);

	return rest_ensure_response([
		'suppentag_id' => $suppentag_id,
		'date'         => $date,
		'is_soldout'   => $is_soldout ? 1 : 0,
	]);
}

// ======================================================
// 🔒 REST-Beschränkung auf eingeloggte Benutzer
// ======================================================
add_filter('rest_pre_dispatch', function ($result, $server, $request) {
	$route = $request->get_route();
	if (strpos($route, '/wp/v2/ud-reservation') !== false && !is_user_logged_in()) {
		return new WP_Error(
			'rest_forbidden',
			__('Sie müssen angemeldet sein, um Reservationen zu sehen oder zu bearbeiten.', 'ud-reservation-ud'),
			['status' => 401]
		);
	}
	return $result;
}, 10, 3);

// ======================================================
// 🔢 REST-Metafelder für Reservationen
// ======================================================
add_action('init', function () {
	$fields = [
		'reservation_name',
		'reservation_phone',
		'reservation_persons',
		'reservation_menu',
		'reservation_present',
		'reservation_datetime',
		'suppentag_id', // 🆕 Verknüpfung zum CPT Suppentag
	];

	foreach ($fields as $field) {
		register_post_meta('ud_reservation', $field, [
			'show_in_rest'  => true,
			'single'        => true,
			'type'          => 'string',
			'auth_callback' => fn() => current_user_can('edit_posts'),
		]);
	}
});

// ======================================================
// 📡 Ably-Events für Reservationen
// ======================================================
require_once UD_RESERVATION_PATH . 'includes/ably-events.php';

// ======================================================
// 🌐 Öffentliche REST-Route für Kiosk (Reservationen & Ausverkauft)
// ======================================================
require_once UD_RESERVATION_PATH . 'includes/api-public.php';

// ======================================================
// 🧱 Admin Columns und Hilfen
// ======================================================
require_once UD_RESERVATION_PATH . 'includes/admin-columns.php';
require_once UD_RESERVATION_PATH . 'includes/helpers.php';
require_once UD_RESERVATION_PATH . 'includes/meta-box-suppentag.php';
require_once UD_RESERVATION_PATH . 'includes/settings-suppen.php'; // Option Page

// ======================================================
// 🖥️ Frontend Assets
// ======================================================
add_action('wp_enqueue_scripts', function () {

	// Ably-CDN einmalig
	if (!wp_script_is('ably-cdn', 'registered')) {
		wp_register_script(
			'ably-cdn',
			'https://cdn.ably.io/lib/ably.min-1.js',
			[],
			null,
			true
		);
	}

	// Frontend-Reservierung
	wp_enqueue_script(
		'ud-reservation-frontend',
		plugins_url('build/frontend.js', __FILE__),
		['ably-cdn', 'wp-api-fetch', 'wp-element', 'wp-components'],
		filemtime(plugin_dir_path(__FILE__) . 'build/frontend.js'),
		true
	);

	wp_enqueue_style(
		'ud-reservation-frontend',
		plugins_url('build/frontend.css', __FILE__),
		[],
		filemtime(plugin_dir_path(__FILE__) . 'build/frontend.css')
	);

	wp_localize_script('ud-reservation-frontend', 'udReservationSettings', [
		'nonce'   => wp_create_nonce('wp_rest'),
		'ablyKey' => defined('ABLY_API_KEY') ? ABLY_API_KEY : '',
	]);

	// Kiosk-Ansicht (nur auf /kiosk)
	if (is_page('kiosk')) {
		wp_enqueue_script(
			'ud-reservation-kiosk',
			plugins_url('build/kiosk.js', __FILE__),
			['ably-cdn', 'wp-api-fetch'],
			filemtime(plugin_dir_path(__FILE__) . 'build/kiosk.js'),
			true
		);

		wp_enqueue_style(
			'ud-reservation-kiosk',
			plugins_url('build/kiosk.css', __FILE__),
			[],
			filemtime(plugin_dir_path(__FILE__) . 'build/kiosk.css')
		);

		wp_localize_script('ud-reservation-kiosk', 'udReservationSettings', [
			'ablyKey' => defined('ABLY_API_KEY') ? ABLY_API_KEY : '',
		]);
	}

	wp_enqueue_script(
		'ud-produktion-verkauf',
		plugins_url('build/produktion.js', __FILE__),
		['wp-api-fetch', 'wp-element'],
		filemtime(plugin_dir_path(__FILE__) . 'build/produktion.js'),
		true
	);

	wp_enqueue_style(
		'ud-produktion-verkauf',
		plugins_url('build/produktion.css', __FILE__),
		[],
		filemtime(plugin_dir_path(__FILE__) . 'build/produktion.css')
	);

	// 🔹 UD Verpflegung Script
	wp_enqueue_script(
		'ud-verpflegung-frontend',
		plugins_url('build/verpflegung.js', __FILE__),
		['wp-api-fetch', 'wp-element'],
		filemtime(plugin_dir_path(__FILE__) . 'build/verpflegung.js'),
		true
	);

	// CSS laden
	wp_enqueue_style(
		'ud-verpflegung-frontend',
		plugins_url('build/verpflegung.css', __FILE__),
		[],
		filemtime(plugin_dir_path(__FILE__) . 'build/verpflegung.css')
	);
});

// ======================================================
// 🧩 Shortcodes
// ======================================================
add_shortcode('ud_reservation', function () {
	return '<div id="ud-reservation-form-root"></div>';
});

add_shortcode('ud_kiosk', function () {
	ob_start();
	$heute = date_i18n('Y-m-d');
	$settings = get_option('ud_suppentage_settings', [
		'mode' => 'both',
		'interval' => 10,
	]);
	$mode = esc_attr($settings['mode']);
	$interval = intval($settings['interval']);
	?>
	<div id="ud-kiosk-root"
		data-today="<?php echo esc_attr($heute); ?>"
		data-mode="<?php echo $mode; ?>"
		data-interval="<?php echo $interval; ?>">
		<div class="ud-kiosk-header">
			<h3 class="ud-kiosk-suppe">Heute: <span id="ud-suppe-name">–</span></h3>
			<h2 class="ud-kiosk-title">Unsere heutigen Reservationen</h2>
		</div>
		<div id="ud-kiosk-list" class="ud-kiosk-grid">Lade Reservationen ...</div>
	</div>
	<?php
	return ob_get_clean();
});

add_shortcode('ud_kiosk_ausverkauf', function () {
	ob_start();
?>
	<div id="ud-kiosk-ausverkauf" data-today="<?php echo esc_attr(date('Y-m-d')); ?>">
		<div class="ud-kiosk-soldout hidden">
			<span>Ausverkauft</span>
		</div>
	</div>
<?php
	return ob_get_clean();
});


// ======================================================
// 🧩 Shortcode: UD Produktion + Verkauf Button
// ======================================================
add_shortcode('ud_statistik_button', function () {
	ob_start();
	$today = date('Y-m-d');
?>

	<button id="ud-start-produktion" class="ud-produktion-button ud-button-bar-button" data-date="">
		<div class="ud-verpflegung-progress-ring progress-ring">
			<svg viewBox="0 0 36 36">
				<circle class="bg" cx="18" cy="18" r="16"></circle>
				<circle class="progress" cx="18" cy="18" r="16"></circle>
			</svg>
		</div>
		<div class="ud-verpflegung-button-content button-content">
			<div class="label">Produktion + Verkauf</div>
			<div class="progress-text">0 Lieferanten erfasst</div>
		</div>
	</button>

	<div id="ud-produktion-modal" class="ud-produktion-modal ud-modal" hidden>
		<div class="ud-modal-backdrop"></div>
		<div class="ud-produktion-modal-content ud-modal-content">
			<button class="ud-produktion-modal-close ud-modal-close"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M6.4 19L5 17.6L10.6 12L5 6.4L6.4 5L12 10.6L17.6 5L19 6.4L13.4 12L19 17.6L17.6 19L12 13.4L6.4 19Z" fill="#B2B2B2"/>
</svg></button>
			<div id="ud-produktion-loading">Lade Statistik…</div>
			<div id="ud-produktion-form" hidden></div>
		</div>
	</div>
<?php
	return ob_get_clean();
});

// ======================================================
// 🧠 Suppentag: Titel automatisch in EU-Datum umwandeln
// ======================================================
add_action('save_post_ud_suppentag', function ($post_id, $post, $update) {
	if (wp_is_post_autosave($post_id) || wp_is_post_revision($post_id)) return;

	$date = get_post_meta($post_id, 'suppentag_date', true);
	if (!$date) return;

	// Nur anpassen, wenn Titel das ISO-Format enthält
	if (strpos($post->post_title, '-') !== false) {
		$parts = explode('-', $date);
		if (count($parts) === 3) {
			[$year, $month, $day] = $parts;
			$new_title = "Suppentag {$day}.{$month}.{$year}";
			remove_action('save_post_ud_suppentag', __FUNCTION__, 10);
			wp_update_post(['ID' => $post_id, 'post_title' => $new_title]);
			add_action('save_post_ud_suppentag', __FUNCTION__, 10, 3);
		}
	}
}, 10, 3);




add_action('wp_footer', function() {
	echo '<!-- Debug Flatpickr -->';
	wp_print_scripts('flatpickr-js');
	wp_print_scripts('flatpickr-locale-de');
});
