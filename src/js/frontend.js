import apiFetch from "@wordpress/api-fetch";
import "../css/frontend.scss";
import iconPeopleGroup from "../assets/icons/users.svg";
import iconCheese from "../assets/icons/cheese.svg";
import iconClock from "../assets/icons/clock.svg";
import iconEdit from "../assets/icons/edit.svg";
import iconCalendar from "../assets/icons/calendar.svg";
import iconClose from "../assets/icons/close.svg";
//import flatpickr from  "../assets/vendor/flatpickr/flatpickr.min.js";
import { udConfirm } from "./helpers/confirm";

console.log("[UD-Reservation] frontend.js geladen ✅");

/* =============================================================== *\
   Title
\* =============================================================== */
import flatpickr from "../assets/vendor/flatpickr/flatpickr.min.js";
import "../assets/vendor/flatpickr/de.js";

/* =====================================================
   🔌 Ably Realtime – global verfügbar über CDN
===================================================== */
window.ably = null;
window.ablyChannel = null;

if (typeof Ably !== "undefined") {
	console.log("[UD-Reservation] ✅ Ably geladen (CDN-Version erkannt)");
	try {
		window.ably = new Ably.Realtime({
			key: window.udReservationSettings?.ablyKey || "",
			clientId: "frontend-" + Math.random().toString(36).substring(2, 8), // 🔹 eindeutige ID pro Tab

			echoMessages: true, // ✅ eigene Events ebenfalls empfangen
		});
		window.ably.connection.on("connecting", () =>
			console.log("🔄 Ably verbindet...")
		);
		window.ably.connection.on("connected", () =>
			console.log("✅ Ably verbunden")
		);
		window.ably.connection.on("failed", () =>
			console.error("❌ Ably Verbindung fehlgeschlagen")
		);
		window.ablyChannel = window.ably.channels.get("reservations");
		window.ably.connection.once("connected", () => {
			document.dispatchEvent(new CustomEvent("ably-ready"));
		});
	} catch (err) {
		console.error(
			"[UD-Reservation] ⚠️ Ably-Initialisierung fehlgeschlagen:",
			err
		);
	}
} else {
	console.error("[UD-Reservation] ❌ Ably ist nicht geladen!");
}

/* =====================================================
   🔐 Nonce aktivieren
===================================================== */
if (window.udReservationSettings?.nonce) {
	apiFetch.use(
		apiFetch.createNonceMiddleware(window.udReservationSettings.nonce)
	);
}

/* =====================================================
   🧠 Suppentag-Verknüpfung – zentrale Utility-Funktion
===================================================== */
import { ensureSuppentagExists, getSuppentagById } from "./helpers/suppentag";

// =====================================================
// 🔧 Suppentag → UI aktualisieren
// =====================================================

/* =====================================================
   🧩 Hauptlogik
===================================================== */
document.addEventListener("DOMContentLoaded", () => {
	const root = document.getElementById("ud-reservation-form-root");
	if (!root) return;

	root.innerHTML = `
		<div class="ud-res-header">
			<h2>Reservationen</h2>
			<div class="ud-res-controls">
				<label class="toggle-wrapper">
					<input type="checkbox" id="reservation-soldout" />
					<span class="toggle-slider"></span>
					<span class="toggle-label">Ausverkauft</span>
				</label>
				<button id="reservation-add" class="add-btn">
					<i class="fa-solid fa-user-plus"></i> Reservation hinzufügen
				</button>
			</div>
		</div>
		<div class="ud-res-date">
			<div class="calendar_icon">${iconCalendar}</div>
			<input type="date" id="reservation-date-flatpickr" />
		</div>
		<div id="reservation-list" class="ud-res-list"></div>

		<!-- Modal -->
		<div id="reservation-modal" class="ud-modal hidden">
			<div class="ud-modal-backdrop"></div>
			<div class="ud-modal-content">
				<button class="ud-modal-close" type="button">${iconClose}</button>
				<h3 id="modal-title" class="ud-modal-title">Reservation bearbeiten</h3>
				<form id="reservation-edit-form">
					<label>Name <input type="text" name="reservation_name" required></label>
					<label>Telefonnummer <input type="text" name="reservation_phone"></label>
					<label>Anzahl Personen <input type="number" name="reservation_persons" min="1"></label>
					<label>Uhrzeit <input id="reservation-time-flatpickr" type="text" value="14:00"></label>
					<label>Menü-Zusatz <input type="text" name="reservation_menu"></label>
					<!--<label class="ud-checkbox"><input type="checkbox" name="reservation_present"> Anwesend</label>-->
					<div class="buttons actions">
						<div class="left-actions">
							<button type="button" class="delete button-delete" id="reservation-delete">
								<i class="fa-regular fa-trash-can"></i> Löschen
							</button>
						</div>

						<div class="right-actions">
							<button type="button" class="cancel button-cancel">Abbrechen</button>
							<button type="submit" class="save button-save">Speichern</button>
						</div>
					</div>
				</form>
			</div>
		</div>
	`;

	// DOM-Referenzen
	const list = document.getElementById("reservation-list");
	const modal = document.getElementById("reservation-modal");
	const form = document.getElementById("reservation-edit-form");
	const cancelBtn = form.querySelector(".cancel");
	const closeBtn = document.querySelector(
		"#reservation-modal .ud-modal-close"
	);
	const addBtn = document.getElementById("reservation-add");
	const soldoutToggle = document.getElementById("reservation-soldout");
	const datePicker = document.getElementById("reservation-date");
	const dateLabel = document.getElementById("reservation-date-label");
	const backDrop = document.querySelector(
		"#reservation-modal .ud-modal-backdrop"
	);
	let soldoutState = false;
	let currentId = null;

	/* =====================================================
	   ⚙️ Ausverkauft (synchron mit DB + Ably)
	===================================================== */
	async function loadSoldoutState() {
		//const date = datePicker.value;
		const date = fpInput.value;
		try {
			const res = await fetch(
				`/wp-json/ud-reservation/v1/soldout?date=${date}&t=${Date.now()}`
			);
			const data = await res.json();
			soldoutState = data?.is_soldout === 1;
			soldoutToggle.checked = soldoutState;
			addBtn.disabled = soldoutState;
			addBtn.classList.toggle("is-disabled", soldoutState);
			console.log(`📦 Echtwert aus DB übernommen: ${soldoutState}`);
		} catch (err) {
			console.error(
				"[UD-Reservation] Fehler beim Laden von Ausverkauft:",
				err
			);
		}
	}

	async function saveSoldoutState() {
		//const date = datePicker.value;
		const date = fpInput.value;
		try {
			const response = await fetch("/wp-json/ud-reservation/v1/soldout", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					date,
					is_soldout: soldoutToggle.checked ? 1 : 0,
				}),
			});

			if (!response.ok) throw new Error(`HTTP ${response.status}`);

			console.log(
				`💾 Ausverkauft-Status erfolgreich gespeichert: ${soldoutToggle.checked}`
			);

			if (window.ablyChannel) {
				window.ablyChannel.publish({
					name: "soldout_update",
					data: { date, status: soldoutToggle.checked },
				});
			}
		} catch (err) {
			console.error(
				"[UD-Reservation:FEHLER] Fehler beim Speichern:",
				err
			);
			soldoutToggle.checked = !soldoutToggle.checked;
		}
	}

	// 🟢 Toggle-Event: nur nach erfolgreichem Save gültig
	soldoutToggle.addEventListener("change", async () => {
		await saveSoldoutState();
	});

	// 🟢 Echtzeit-Listener: reagiert auf andere Benutzer & Tabs
	document.addEventListener("ably-ready", () => {
		if (!window.ablyChannel) return;

		console.log("📡 Ably-Channel bereit, Listener aktiviert");

		// 🔸 1. Ausverkauft-Status live halten
		window.ablyChannel.subscribe("soldout_update", (message) => {
			const { date, status } = message.data || {};

			//if (date === datePicker.value) {
			if (date === fpInput.value) {
				console.log("📡 Ably: soldout_update →", date, status);
				soldoutToggle.checked = !!status;
				addBtn.disabled = !!status;
				addBtn.classList.toggle("is-disabled", !!status);
			}
		});

		// 🔸 2. Neue Reservation → Liste neu laden
		window.ablyChannel.subscribe("reservation_create", (message) => {
			console.log("📡 Ably: reservation_create →", message.data);
			loadReservations();
		});

		// 🔸 3. Reservation aktualisiert → Liste neu laden (andere Clients)
		window.ablyChannel.subscribe("reservation_update", (message) => {
			const senderId = message.data?.clientId;
			if (senderId === window.ably.auth.clientId) {
				// ⛔ eigenes Update – ignorieren, sonst flackert Liste
				return;
			}
			console.log("📡 Ably: reservation_update →", message.data);
			loadReservations();
		});

		// 🔸 4. Reservation gelöscht → Liste neu laden
		window.ablyChannel.subscribe("reservation_delete", (message) => {
			console.log("📡 Ably: reservation_delete →", message.data);
			loadReservations();
		});
	});

	/* =====================================================
	   📅 Datumsauswahl
	===================================================== */

	const fpInput = document.querySelector("#reservation-date-flatpickr");
	const calendar_icon = document.querySelector(".calendar_icon");

	if (!fpInput || !window.flatpickr) return;

	const German = window.flatpickr?.l10ns?.de;
	if (German) window.flatpickr.localize(German);

	// Flatpickr initialisieren
	const fp = window.flatpickr(fpInput, {
		locale: German,
		dateFormat: "Y-m-d",
		altInput: true,
		altFormat: "l, j. F Y",
		altInputClass: "ud-flatpickr-alt-input", // <— eigene Klasse

		defaultDate: new Date(),
		disableMobile: true,
		onChange(selectedDates, dateStr, instance) {
			console.log("Neues Datum:", dateStr);
			// 🔥 Suppentag sicherstellen
			//ensureSuppentagExists(dateStr);

			loadSoldoutState();
			loadReservations();
		},
	});

	// 🛠️ TECHNISCHES DATUM SICHERN (wichtig für reservation_datetime)
	if (!fpInput.value) {
		const d = fp.selectedDates?.[0] || new Date();
		fpInput.value = d.toISOString().split("T")[0];
	}

	window.udReservationDatepicker = fp;
	const fpDateValue = window.udReservationDatepicker.input.value;

	// Klick auf Icon öffnet/schließt den Kalender
	calendar_icon.addEventListener("click", (e) => {
		e.preventDefault();
		if (fp.isOpen) {
			fp.close();
		} else {
			fp.open();
		}
	});

	const pfTimeInput = document.querySelector("#reservation-time-flatpickr");
	if (!pfTimeInput) return;

	// 👇 globale Variable
	window.fpTimePicker = window.flatpickr(pfTimeInput, {
		enableTime: true,
		noCalendar: true,
		dateFormat: "H:i",
		time_24hr: true,
		altInput: true,
		altFormat: "H:i",
		allowInput: true,
		disableMobile: true,
		defaultDate: pfTimeInput.value || "12:00",
	});

	/* =====================================================
	   🧾 Reservationen laden
	===================================================== */
	async function loadReservations() {
		list.innerHTML = "<p>Lade Reservationen...</p>";
		//const selectedDate = datePicker.value;
		const selectedDate = fpInput.value; // technisches Datum, z. B. "2025-11-10"

		try {
			const data = await apiFetch({
				path: "/wp/v2/ud-reservation?per_page=100",
			});
			const filtered = data.filter((r) => {
				const dt =
					r.meta?.reservation_datetime ||
					r.meta?.reservation_date ||
					"";
				return dt.startsWith(selectedDate);
			});
			if (!filtered.length) {
				list.innerHTML = "<p>Keine Reservationen gefunden.</p>";
				return;
			}

			filtered.sort((a, b) => {
				const timeA =
					(a.meta?.reservation_datetime?.match(/T(\d{2}:\d{2})/) ||
						[])[1] || "";
				const timeB =
					(b.meta?.reservation_datetime?.match(/T(\d{2}:\d{2})/) ||
						[])[1] || "";
				return timeA.localeCompare(timeB, "de", { numeric: true });
			});

			list.innerHTML = `
				<div class="ud-res-list-flex">
					${filtered
						.map((r) => {
							const m = r.meta || {};
							const name = m.reservation_name || "";
							const persons = m.reservation_persons || "";
							const menu = m.reservation_menu || "–";
							const present = m.reservation_present === "1";
							const time =
								(m.reservation_datetime?.match(
									/T(\d{2}:\d{2})/
								) || [])[1] ||
								m.reservation_time ||
								"--:--";
							return `
								<div class="ud-res-item ${present ? "is-present" : ""}">
									<div class="ud-res-name">${name}</div>
									<div class="ud-res-meta">
									  	<span class="ud-anzahl-personen">${iconPeopleGroup}${persons}</span>
									  	<span class="ud-uhrzeit">${iconClock}${time}</span>
									  	<span class="ud-supplement">${iconCheese}${menu}</span>
									</div>
									<div class="ud-res-status ${present ? "is-present" : ""}">
										${present ? "anwesend" : "abwesend"}
									</div>
									<div class="ud-res-actions">
										<button class="edit" data-id="${r.id}" title="Bearbeiten">
											${iconEdit}
										</button>
									</div>
								</div>`;
						})
						.join("")}
				</div>`;
		} catch (error) {
			list.innerHTML = `<p>Fehler: ${error.message}</p>`;
		}
	}

	function reservationHasUnsavedChanges() {
		const data = modal.udReservationData;
		if (!data) return false;

		const orig = data.original;

		const curr = {
			reservation_name: form
				.querySelector('[name="reservation_name"]')
				.value.trim(),
			reservation_phone: form
				.querySelector('[name="reservation_phone"]')
				.value.trim(),
			reservation_persons: form
				.querySelector('[name="reservation_persons"]')
				.value.trim(),
			reservation_time:
				document
					.getElementById("reservation-time-flatpickr")
					?.value.trim() || "",
			reservation_menu: form
				.querySelector('[name="reservation_menu"]')
				.value.trim(),
		};

		return JSON.stringify(orig) !== JSON.stringify(curr);
	}

	function tryCloseReservationModal() {
		if (!modal.udReservationData) {
			modal.classList.add("hidden");
			form.reset();
			currentId = null;
			return;
		}

		// Falls nichts geändert → sofort schliessen
		if (!reservationHasUnsavedChanges()) {
			modal.classList.add("hidden");
			form.reset();
			currentId = null;
			return;
		}

		// 🔥 Änderungen vorhanden → Confirm öffnen
		udConfirm(
			"Du hast Änderungen vorgenommen. Möchtest du speichern?",
			"Änderungen vorhanden",
			{
				okLabel: "Speichern",
				cancelLabel: "Nicht speichern",

				onSave: () => form.requestSubmit(),
				onDiscard: () => {
					modal.classList.add("hidden");
					form.reset();
					currentId = null;
				},
			}
		);
	}

	/* =====================================================
	   ✏️ Modal-Steuerung
	===================================================== */

	addBtn.addEventListener("click", () => {
		modal.classList.remove("hidden");
		form.reset();
		currentId = null;

		modal.udReservationData = {
			original: {
				reservation_name: "",
				reservation_phone: "",
				reservation_persons: "",
				reservation_time: "",
				reservation_menu: "",
			},
			id: null,
		};

		document.getElementById("modal-title").textContent =
			"Neue Reservation hinzufügen";

		const deleteBtn = document.getElementById("reservation-delete");
		if (deleteBtn) deleteBtn.classList.add("hidden");

		if (window.fpTimePicker) {
			window.fpTimePicker.setDate("12:00", true);
		}
	});

	closeBtn.addEventListener("click", tryCloseReservationModal);
	cancelBtn.addEventListener("click", tryCloseReservationModal);
	backDrop.addEventListener("click", tryCloseReservationModal);

	/* =====================================================
	   🧾 Formular absenden (Validierung + Speichern)
	===================================================== */
	form.addEventListener("submit", async (e) => {
		e.preventDefault();

		// Vorhandene Fehlermeldungen entfernen
		form.querySelectorAll(".ud-error-msg").forEach((el) => el.remove());
		let hasError = false;

		const nameField = form.querySelector('[name="reservation_name"]');
		const personsField = form.querySelector('[name="reservation_persons"]');
		const timeField = form.querySelector("#reservation-time-flatpickr");

		function showError(field, message) {
			hasError = true;
			field.classList.add("ud-error");
			const msg = document.createElement("div");
			msg.className = "ud-error-msg";
			msg.textContent = message;
			field.insertAdjacentElement("afterend", msg);
		}

		if (!nameField.value.trim())
			showError(nameField, "Bitte Name eingeben");
		if (!personsField.value || parseInt(personsField.value, 10) < 1)
			showError(personsField, "Bitte Anzahl Personen angeben");
		if (!timeField.value.trim())
			showError(timeField, "Bitte Uhrzeit auswählen");

		if (hasError) return;

		[nameField, personsField, timeField].forEach((f) =>
			f.classList.remove("ud-error")
		);

		// 🔹 Flatpickr-Zeitwert sicherstellen
		let selectedTime = timeField.value;
		if (window.fpTimePicker && window.fpTimePicker.selectedDates?.length) {
			// Falls Flatpickr läuft → Wert aus Picker lesen
			const dateObj = window.fpTimePicker.selectedDates[0];
			const hours = dateObj.getHours().toString().padStart(2, "0");
			const minutes = dateObj.getMinutes().toString().padStart(2, "0");
			selectedTime = `${hours}:${minutes}`;
		}

		// 🔹 Meta-Daten vorbereiten
		/*
		const formData = new FormData(form);
		const meta = {};
		formData.forEach((v, k) => {
			const field = form.querySelector(`[name="${k}"]`);
			meta[k] =
				field.type === "checkbox" ? (field.checked ? "1" : "0") : v;
		});

		const selectedDate = fpInput.value; // dein Flatpickr-Datum
		if (!selectedDate) {
			const d = fp.selectedDates?.[0] || new Date();
			selectedDate = d.toISOString().split("T")[0];
		}

		meta.reservation_time = selectedTime || "00:00";
		meta.reservation_datetime = `${selectedDate}T${meta.reservation_time}:00`;

*/
		// 🔹 Meta-Daten vorbereiten
		const formData = new FormData(form);
		const meta = {};
		formData.forEach((v, k) => {
			const field = form.querySelector(`[name="${k}"]`);
			meta[k] =
				field.type === "checkbox" ? (field.checked ? "1" : "0") : v;
		});

		// 🔥 Suppentag-ID sicherstellen
		const selectedDate = fpInput.value;
		const suppentagId = await ensureSuppentagExists(selectedDate);
		//meta.suppentag_id = suppentagId;
		meta.suppentag_id = String(suppentagId);

		meta.reservation_time = selectedTime || "00:00";
		meta.reservation_datetime = `${selectedDate}T${meta.reservation_time}:00`;

		try {
			let savedReservation;

			if (currentId) {
				// 🔹 Update bestehende Reservation
				savedReservation = await apiFetch({
					path: `/wp/v2/ud-reservation/${currentId}`,
					method: "PATCH",
					data: {
						meta,
						title: meta.reservation_name || "Reservation",
					},
				});

				window.ablyChannel?.publish("reservation_update", {
					id: currentId,
					date: selectedDate,
					meta,
					clientId: window.ably.auth.clientId,
				});
			} else {
				// 🔹 Neue Reservation speichern
				savedReservation = await apiFetch({
					path: `/wp/v2/ud-reservation`,
					method: "POST",
					data: {
						title: meta.reservation_name || "Neue Reservation",
						status: "publish",
						meta,
					},
				});

				window.ablyChannel?.publish("reservation_create", {
					id: savedReservation.id,
					date: selectedDate,
					meta,
				});
			}

			console.log("💾 Reservation gespeichert:", savedReservation);
			modal.classList.add("hidden");
			loadReservations();
		} catch (err) {
			console.error("Fehler beim Speichern:", err);
			const saveBtn = form.querySelector(".save");
			let msg = form.querySelector(".ud-error-global");
			if (!msg) {
				msg = document.createElement("div");
				msg.className = "ud-error-msg ud-error-global";
				saveBtn.insertAdjacentElement("beforebegin", msg);
			}
			msg.textContent = "Fehler beim Speichern: " + err.message;
		}
	});

	/* =====================================================
   ✏️ Globale Event-Delegation (Edit, Delete, Present Toggle)
   👉 Funktioniert auch nach innerHTML-Neuaufbau
===================================================== */
	document.addEventListener("click", async (e) => {
		const editBtn = e.target.closest(".edit");
		const deleteBtn = e.target.closest(".delete");
		const statusToggle = e.target.closest(".ud-res-status");

		// ✏️ Reservation bearbeiten
		if (editBtn) {
			const id = editBtn.dataset.id;

			try {
				const data = await apiFetch({
					path: `/wp/v2/ud-reservation/${id}`,
				});

				currentId = data.id;

				// 🔹 Delete-Button sichtbar machen
				const deleteBtn = document.getElementById("reservation-delete");
				if (deleteBtn) {
					deleteBtn.classList.remove("hidden");
					deleteBtn.dataset.id = data.id;
				}

				// 🔹 Alle Inputs zuerst leeren
				form.querySelectorAll("input").forEach((input) => {
					if (input.type === "checkbox") input.checked = false;
					else input.value = "";
				});

				// 🔹 Meta-Daten aus API übernehmen
				const meta = data.meta || {};
				Object.entries(meta).forEach(([key, value]) => {
					const field = form.querySelector(`[name="${key}"]`);
					if (!field) return;

					if (field.type === "checkbox") {
						field.checked = value === "1";
					} else {
						field.value = value || "";
					}
				});

				// 🕐 Zeitfeld behandeln
				const timeInput = document.querySelector(
					"#reservation-time-flatpickr"
				);
				if (timeInput) {
					let timeValue = meta.reservation_time || "";

					// Falls nicht vorhanden, Zeit aus reservation_datetime extrahieren
					if (!timeValue && meta.reservation_datetime) {
						const match =
							meta.reservation_datetime.match(/T(\d{2}:\d{2})/);
						if (match) timeValue = match[1];
					}

					if (window.fpTimePicker) {
						window.fpTimePicker.setDate(timeValue || "12:00", true);
					}

					timeInput.value = timeValue || "12:00";
				}

				// 🧠 Originalzustand merken (hier einfügen!)
				modal.udReservationData = {
					original: {
						reservation_name: meta.reservation_name || "",
						reservation_phone: meta.reservation_phone || "",
						reservation_persons: meta.reservation_persons || "",
						reservation_time:
							meta.reservation_time ||
							(meta.reservation_datetime?.match(
								/T(\d{2}:\d{2})/
							) || [])[1] ||
							"",
						reservation_menu: meta.reservation_menu || "",
					},
					id: data.id,
				};

				// 🔹 Modal öffnen
				document.getElementById("modal-title").textContent =
					"Reservation bearbeiten";
				modal.classList.remove("hidden");
			} catch (err) {
				alert("Fehler beim Laden: " + err.message);
			}
			return;
		}

		// 🗑 Reservation löschen
		if (deleteBtn) {
			const id = deleteBtn.dataset.id;
			const date = fpInput.value;

			udConfirm(
				"Möchtest du diese Reservation wirklich löschen?",
				"Reservation löschen",
				{
        okLabel: "Löschen",
        cancelLabel: "Nicht löschen",
					onSave: async () => {
						// 🔥 LÖSCHEN
						try {
							await apiFetch({
								path: `/wp/v2/ud-reservation/${id}`,
								method: "DELETE",
							});

							window.ablyChannel?.publish("reservation_delete", {
								id,
							});

							modal.classList.add("hidden");
							form.reset();
							currentId = null;
							loadReservations();
						} catch (err) {
							console.error("Fehler beim Löschen:", err);
							alert("Fehler beim Löschen: " + err.message);
						}
					},

					onDiscard: () => {
						// ❌ Nicht löschen → nichts tun
					},
				}
			);

			return;
		}

		// ✅ Anwesenheitsstatus direkt umschalten
		if (statusToggle) {
			const item = statusToggle.closest(".ud-res-item");
			const editBtnInItem = item?.querySelector(".edit");
			const id = editBtnInItem?.dataset.id;

			if (!id) return;

			const currentlyPresent =
				statusToggle.classList.contains("is-present");
			const newState = !currentlyPresent;

			// Optisch sofort aktualisieren
			statusToggle.classList.toggle("is-present", newState);
			statusToggle.textContent = newState ? "anwesend" : "abwesend";

			item.classList.toggle("is-present", newState);

			try {
				await apiFetch({
					path: `/wp/v2/ud-reservation/${id}`,
					method: "PATCH",
					data: {
						meta: { reservation_present: newState ? "1" : "0" },
					},
				});

				console.log(
					`💾 Anwesenheitsstatus geändert: ${
						newState ? "anwesend" : "abwesend"
					}`
				);
				window.ablyChannel?.publish("reservation_update", {
					id,
					field: "reservation_present",
					value: newState ? "1" : "0",
					clientId: window.ably.auth.clientId,
				});
			} catch (err) {
				console.error(
					"Fehler beim Aktualisieren des Anwesenheitsstatus:",
					err
				);
				// Zustand zurücksetzen, falls Fehler
				statusToggle.classList.toggle("is-present", currentlyPresent);
				statusToggle.textContent = currentlyPresent
					? "anwesend"
					: "abwesend";
			}
		}
	});

	/* =====================================================
	   🚀 Initial starten
	===================================================== */
	loadReservations();
});
