<?php
defined('ABSPATH') || exit;

/**
 * Öffentliche Route: Reservationen für Kiosk anzeigen
 */
add_action('rest_api_init', function () {
    register_rest_route('ud-reservation/v1', '/public-reservations', [
        'methods'  => 'GET',
        'callback' => function ($req) {
            $date = sanitize_text_field($req->get_param('date')) ?: date_i18n('Y-m-d');

            $q = new WP_Query([
                'post_type'      => 'ud_reservation',
                'post_status'    => 'publish',
                'posts_per_page' => 200,
                'meta_query'     => [
                    'relation' => 'OR',
                    [
                        'key'     => 'reservation_date',
                        'value'   => $date,
                        'compare' => 'LIKE',
                    ],
                    [
                        'key'     => 'reservation_datetime',
                        'value'   => $date,
                        'compare' => 'LIKE',
                    ],
                ],
            ]);

            $reservations = [];

            foreach ($q->posts as $p) {
                $meta = get_post_meta($p->ID);

                $reservations[] = [
                    'id'   => $p->ID,
                    'meta' => [
                        'reservation_name'     => $meta['reservation_name'][0] ?? '',
                        'reservation_persons'  => $meta['reservation_persons'][0] ?? '',
                        'reservation_datetime' => $meta['reservation_datetime'][0] ?? '',
                        'reservation_menu'     => $meta['reservation_menu'][0] ?? '',
                        'reservation_present'  => $meta['reservation_present'][0] ?? '',
                    ],
                ];
            }

            return $reservations;
        },
        'permission_callback' => '__return_true', // 🔓 öffentlich erlaubt
    ]);
});
