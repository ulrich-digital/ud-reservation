jQuery(document).ready(function ($) {
	$(".ud-upload-button").on("click", function (e) {
		e.preventDefault();
		const targetId = $(this).data("target");
		const field = $("#" + targetId);

		const frame = wp.media({
			title: "Bild auswählen oder hochladen",
			button: { text: "Bild übernehmen" },
			multiple: false
		});

		frame.on("select", function () {
			const attachment = frame.state().get("selection").first().toJSON();
			field.val(attachment.url);
		});

		frame.open();
	});
});
