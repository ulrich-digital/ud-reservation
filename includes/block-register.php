<?php
// ================================
// Block Registrierung
// ================================
add_action( 'init', function() {
    register_block_type(
        __DIR__ . '/../', // verweist auf block.json im Plugin-Hauptordner
        [ 'render_callback' => 'ud_reservation_render' ]
    );
}, 20 ); // Priorität 20 sichert, dass alle WordPress-Skripte geladen sind


add_filter( 'rest_pre_dispatch', function( $result, $server, $request ) {
    $route = $request->get_route();

    // Nur für deinen CPT ud_reservation
    if ( strpos( $route, '/wp/v2/ud-reservation' ) !== false ) {
        if ( ! is_user_logged_in() ) {
            return new WP_Error(
                'rest_forbidden',
                __( 'Sie müssen angemeldet sein, um Reservationen zu sehen oder zu bearbeiten.', 'ud-reservation-ud' ),
                [ 'status' => 401 ]
            );
        }
    }

    return $result;
}, 10, 3 );

