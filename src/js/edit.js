import { registerBlockType } from "@wordpress/blocks";
import { __ } from "@wordpress/i18n";
import { useBlockProps } from "@wordpress/block-editor";

registerBlockType("ud/reservation", {
	title: __("UD Reservation", "ud-reservation-ud"),
	icon: "calendar-alt",
	category: "widgets",
	edit: () => {
		const blockProps = useBlockProps({ className: "ud-reservation" });
		return (
			<div {...blockProps}>
				<p>{__("Reservierungsformular wird im Frontend angezeigt.", "ud-reservation-ud")}</p>
			</div>
		);
	},
	save: () => null, // weil render_callback in PHP vorhanden
});
