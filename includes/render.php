<?php
function ud_reservation_render( $attributes, $content ) {
	if ( ! is_user_logged_in() ) {
		return '<p>Bitte melden Sie sich an, um Reservationen vorzunehmen.</p>';
	}
	return '<div id="ud-reservation-form-root"></div>';
}
