jQuery(document).ready(function ($) {
	$("#ud-reservation-table").on("click", ".ud-status-change", function () {
		const btn = $(this);
		const tr = btn.closest("tr");
		const id = tr.data("id");
		const status = btn.data("status");

		btn.prop("disabled", true);

		$.post(udReservationAdmin.ajax_url, {
			action: "ud_reservation_change_status",
			nonce: udReservationAdmin.nonce,
			id,
			status,
		})
			.done((res) => {
				if (res.success) {
					tr.find(".status-col").text(res.data.status);
				} else {
					alert(res.data?.message || "Fehler bei Statusänderung");
				}
			})
			.fail(() => {
				alert("Fehler bei der Verbindung.");
			})
			.always(() => {
				btn.prop("disabled", false);
			});
	});
});
