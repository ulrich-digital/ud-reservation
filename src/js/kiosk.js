import apiFetch from "@wordpress/api-fetch";
import iconPeopleGroup from "../assets/icons/users.svg";
import iconCheese from "../assets/icons/cheese.svg";
import iconClock from "../assets/icons/clock.svg";
import iconEdit from "../assets/icons/edit.svg";
import iconCalendar from "../assets/icons/calendar.svg";
import iconClose from "../assets/icons/close.svg";

import "../css/kiosk.scss";

/*
function kioskDebug(msg) {
	let box = document.getElementById("ud-debug-box");
	if (!box) {
		box = document.createElement("div");
		box.id = "ud-debug-box";
		box.style.position = "fixed";
		box.style.bottom = "0";
		box.style.left = "0";
		box.style.zIndex = "999999";
		box.style.background = "rgba(0,0,0,0.8)";
		box.style.color = "#0f0";
		box.style.font = "12px monospace";
		box.style.padding = "4px 6px";
		box.style.maxHeight = "40vh";
		box.style.overflowY = "auto";
		document.body.appendChild(box);
	}
	const p = document.createElement("div");
	p.textContent = `[${new Date().toLocaleTimeString()}] ${msg}`;
	box.appendChild(p);
	// Nur die letzten 20 Einträge behalten
	while (box.childNodes.length > 20) box.removeChild(box.firstChild);
}
*/


document.addEventListener("DOMContentLoaded", () => {



	/* =====================================================
	   🔐 Nonce aktivieren, falls vorhanden
	===================================================== */
	if (window.udReservationSettings?.nonce) {
		apiFetch.use(apiFetch.createNonceMiddleware(window.udReservationSettings.nonce));
	}

	/* =====================================================
	   🔴 Ausverkauft prüfen (Tabellen-Variante A)
	===================================================== */
	async function checkSoldout() {
		document.querySelectorAll("#ud-kiosk-ausverkauf").forEach(async (root) => {
			const today = root.dataset.today;
			const soldoutEl = root.querySelector(".ud-kiosk-soldout");

			try {
				console.log(`[UD-Kiosk] Prüfe Ausverkauft für: ${today}`);

				// ⬇️ Korrigierte Fetch-Zeile – kein "date" mehr, sondern "today"
				const res = await fetch(`/wp-json/ud-reservation/v1/soldout?date=${today}&t=${Date.now()}`);
				const data = await res.json();
				const isSoldout = data?.is_soldout === 1;

				soldoutEl.classList.toggle("visible", isSoldout);
				soldoutEl.classList.toggle("hidden", !isSoldout);

				console.log(`[UD-Kiosk] Ausverkauft (${today}): ${isSoldout}`);
			} catch (err) {
				console.error("[UD-Kiosk] Fehler beim Prüfen von Ausverkauft:", err);
			}
		});
	}


	/* =====================================================
	   🥣 Tagessuppe + Reservationen laden
	===================================================== */
	document.querySelectorAll("#ud-kiosk-root").forEach((root) => {
		const today = root.dataset.today;
		const listEl = root.querySelector("#ud-kiosk-list");
		const soupEl = root.querySelector("#ud-suppe-name");

		// 🥣 Suppe
		async function loadSoup() {
			try {
				const res = await fetch("/wp-json/ud-reservation/v1/soup");
				const data = await res.json();
				const suppen = data || {};
				const weekday = new Date().toLocaleDateString("de-CH", { weekday: "long" }).toLowerCase();
				const suppe = suppen?.[weekday]?.name || "– keine Suppe hinterlegt –";
				soupEl.textContent = suppe;
			} catch (e) {
				soupEl.textContent = "– Fehler beim Laden –";
				console.error("[UD-Kiosk] Fehler beim Laden der Suppe:", e);
			}
		}

		// 📋 Reservationen
		async function loadReservations() {
// kioskDebug("loadReservations() gestartet");

			try {
				//const data = await fetch(`/wp-json/ud-reservation/v1/public-reservations?date=${today}`).then((res) => res.json());
const data = await fetch(`/wp-json/ud-reservation/v1/public-reservations?date=${today}&_=${Date.now()}`, {
	cache: "no-store",
}).then((res) => res.json());

				if (!Array.isArray(data)) {
					console.error("[UD-Kiosk] Unerwartete API-Antwort:", data);
					listEl.innerHTML = `<p>Fehlerhafte Server-Antwort (nicht angemeldet?)</p>`;
					return;
				}

				const todayList = data.filter((r) => {
					const meta = r.meta || {};
					const dt = meta.reservation_datetime || meta.reservation_date || "";
					return dt.startsWith(today);
				});

				if (!todayList.length) {
					listEl.innerHTML = "<p>Keine Reservationen für heute.</p>";
					return;
				}
// kioskDebug("Liste wird aktualisiert mit " + todayList.length + " Einträgen");

				listEl.innerHTML = todayList
					.map((r) => {
						const m = r.meta || {};
						const name = anonymizeName(m.reservation_name || "–");
						const persons = m.reservation_persons || "-";
						const time =
							m.reservation_time ||
							(m.reservation_datetime?.match(/T(\d{2}:\d{2})/) || [])[1] ||
							"--:--";
						const menu = m.reservation_menu || "";
						const present = m.reservation_present === "1";

						return `
							<div class="ud-kiosk-card ${present ? "is-present" : ""}">
								<h3>${name}</h3>
								<div class="additional_info">
									<p><span>${iconPeopleGroup}</span><span>${persons} Personen</span></p>
									<p><span>${iconClock}</span><span>${time} Uhr</span></p>
									${menu ? `<p><span>${iconCheese}</span><span>${menu}</span></p>` : ""}
								</div>
							</div>`;
					})
					.join("");

				console.log(`[UD-Kiosk] ${todayList.length} Reservation(en) geladen.`);
			} catch (err) {
				console.error("[UD-Kiosk] Fehler beim Laden der Reservationen:", err);
				listEl.innerHTML = `<p>Fehler beim Laden.</p>`;
			}
// kioskDebug("Aktuelles listEl.innerHTML Länge: " + listEl.innerHTML.length);
// kioskDebug("Anzahl #ud-kiosk-list im DOM: " + document.querySelectorAll("#ud-kiosk-list").length);

		}

		function anonymizeName(fullName) {
			const parts = fullName.trim().split(" ");
			if (parts.length < 2) return fullName;
			const [first, last] = parts;
			return `${first.charAt(0)}. ${last}`;
		}

		/* =====================================================
		   🔄 Ably Live-Updates (Reservationen + Ausverkauft)
		===================================================== */

// ✅ Warte-Funktion, bis Ably wirklich verfügbar ist
function waitForAbly(maxTries = 20, delay = 200) {
	return new Promise((resolve, reject) => {
		let tries = 0;
		const check = () => {
			if (typeof Ably !== "undefined") return resolve(Ably);
			if (++tries >= maxTries) return reject(new Error("Ably nicht geladen"));
			setTimeout(check, delay);
		};
		check();
	});
}


		function initRealtime() {
			if (typeof Ably === "undefined") {
				console.warn("[UD-Kiosk] ⚠️ Ably ist nicht geladen!");
		// kioskDebug("Ably nicht geladen");

				return;
			}

			const ably = new Ably.Realtime({
				key: udReservationSettings?.ablyKey || "",
				echoMessages: false,
			});

			const channel = ably.channels.get("reservations");

			ably.connection.once("connected", () => {
				console.log("[UD-Kiosk] 🔌 Verbunden mit Channel:", channel.name);
		// kioskDebug("Ably verbunden mit Channel: " + channel.name);
			});

			// Reconnect-Sicherheit (z. B. WLAN-Verlust)
			ably.connection.on("disconnected", () => {
				console.warn("[UD-Kiosk] 🔌 Verbindung verloren – warte auf Reconnect …");
			});
			ably.connection.on("reconnected", () => {
				console.log("[UD-Kiosk] 🔌 Wieder verbunden – prüfe Ausverkauft erneut");
				checkSoldout();
			});

			// Haupt-Listener
			channel.subscribe((msg) => {
				const event = msg.name;
				const data = msg.data || {};

				console.log("[UD-Kiosk] 🔔 Live-Event:", event, data);
			// kioskDebug("Live-Event: " + event);

				if (["reservation_create", "reservation_update", "reservation_delete"].includes(event)) {
					loadReservations();
				}

				if (event === "soldout_update") {
					const date = data.date;
					const status = !!data.status;

					document.querySelectorAll("#ud-kiosk-ausverkauf").forEach((root) => {
						if (root.dataset.today === date) {
							const soldoutEl = root.querySelector(".ud-kiosk-soldout");
							soldoutEl.classList.toggle("visible", status);
							soldoutEl.classList.toggle("hidden", !status);
							console.log(`[UD-Kiosk] 🔁 Live-Update: ${date} → ${status ? "AUSVERKAUFT" : "frei"}`);
						}
					});
				}
			});
		}

		// 🚀 Initial laden

		//initRealtime();
// 🚀 Initial laden
		loadSoup();
		loadReservations();
		checkSoldout();
		initRealtime();


	});
});
