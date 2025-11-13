import apiFetch from "@wordpress/api-fetch";
import { ensureSuppentagExists } from "./helpers/suppentag";
import "../css/verpflegung.scss";

console.log("[UD-Verpflegung] Modul geladen ✅");

document.addEventListener("DOMContentLoaded", () => {
	const verpflegungBtn = document.getElementById("ud-start-verpflegung");
	const verpflegungModal = document.getElementById("ud-verpflegung-modal");
	const verpflegungBackdrop = verpflegungModal?.querySelector(".ud-modal-backdrop");
	const verpflegungClose = verpflegungModal?.querySelector(".ud-modal-close");
	const verpflegungBody = document.getElementById("ud-verpflegung-form");
	const verpflegungLoading = document.getElementById("ud-verpflegung-loading");
	const datePicker = document.getElementById("reservation-date");

	if (!verpflegungBtn || !verpflegungModal) return;

	/* =====================================================
	   🔄 Fortschrittsring aktualisieren
	===================================================== */
	function updateVerpflegungProgress(meta = {}) {
		const ring = verpflegungBtn.querySelector(".progress");
		const text = verpflegungBtn.querySelector(".progress-text");
		const label = verpflegungBtn.querySelector(".label");

		const keys = [
			"suppentag_znüni_kinder",
			"suppentag_znüni_erwachsene",
			"suppentag_mittag_kinder",
			"suppentag_mittag_erwachsene",
		];

		const total = keys.length;
		const erledigt = keys.filter(
			(k) => meta[k] !== null && meta[k] !== undefined && meta[k] !== ""
		).length;

		const percent = (erledigt / total) * 100;
		const radius = 16;
		const circumference = 2 * Math.PI * radius;
		const offset = circumference - (percent / 100) * circumference;

		if (ring) {
			ring.style.strokeDasharray = `${circumference}`;
			ring.style.strokeDashoffset = offset.toFixed(2);
			ring.style.opacity = erledigt > 0 ? "1" : "0.3";
		}
		if (text) text.textContent = `${erledigt} von ${total} erledigt`;
		if (label) label.textContent = erledigt > 0 ? "Verpflegung" : "Verpflegung";
	}


	/* =====================================================
	   📦 Suppentag-Daten für Datum laden (ohne Erstellen)
	===================================================== */
	async function loadVerpflegungDataForDate(date) {
		if (!date) return;

		try {
			const response = await fetch(`/wp-json/ud/v1/suppentag-by-date?date=${date}`);
			const data = await response.json();

			if (data?.id && data.id > 0) {
				const suppentag = await apiFetch({
					path: `/wp/v2/ud-suppentag/${data.id}?_=${Date.now()}`,
				});
				updateVerpflegungProgress(suppentag.meta || {});
				console.log(`[UD-Verpflegung] Fortschritt geladen für ${date}`);
			} else {
				updateVerpflegungProgress({});
				console.log(`[UD-Verpflegung] Kein Suppentag für ${date}`);
			}
		} catch (err) {
			console.error("[UD-Verpflegung] Fehler beim Laden des Fortschritts:", err);
		}
	}

	/* =====================================================
	   🟢 Initial: beim Seitenstart laden
	===================================================== */
	(async () => {
		const date = datePicker?.value || new Date().toISOString().split("T")[0];
		await loadVerpflegungDataForDate(date);
	})();

	/* =====================================================
	   📅 Datum geändert → Fortschritt neu laden
	===================================================== */
	datePicker?.addEventListener("change", async () => {
		const date = datePicker.value;
		await loadVerpflegungDataForDate(date);
	});

	/* =====================================================
	   🧱 Formularaufbau – Version mit Textinputs (numeric inputmode)
	   🧩 Fix: leere Felder bleiben leer, kein "0"-Bug
	===================================================== */
	function renderVerpflegungForm(suppentagId, meta, date) {
		const d = new Date(date);
		const wochentage = ["So.", "Mo.", "Di.", "Mi.", "Do.", "Fr.", "Sa."];
		const formattedDate = `${wochentage[d.getDay()]} ${d
			.getDate()
			.toString()
			.padStart(2, "0")}.${(d.getMonth() + 1).toString().padStart(2, "0")}.${d.getFullYear()}`;

		verpflegungBody.innerHTML = `
		<h3 class="ud-modal-title">Verpflegung vom ${formattedDate}</h3>

		<div class="verpflegung-group ud-inner-group">
			<h4>Znüni</h4>
			<div class="rows">
				<div class="row">
					<label for="zn-kinder">Kinder</label>
					<input type="text" inputmode="numeric" pattern="[0-9]*" id="zn-kinder">
				</div>
				<div class="row">
					<label for="zn-erwachsene">Erwachsene</label>
					<input type="text" inputmode="numeric" pattern="[0-9]*" id="zn-erwachsene">
				</div>
			</div>
		</div>

		<div class="verpflegung-group ud-inner-group">
			<h4>Zmittag</h4>
			<div class="rows">
				<div class="row">
					<label for="mi-kinder">Kinder</label>
					<input type="text" inputmode="numeric" pattern="[0-9]*" id="mi-kinder">
				</div>
				<div class="row">
					<label for="mi-erwachsene">Erwachsene</label>
					<input type="text" inputmode="numeric" pattern="[0-9]*" id="mi-erwachsene">
				</div>
			</div>
		</div>

		<div class="actions">
			<button id="cancel-verpflegung" class="button-cancel">Abbrechen</button>
			<button id="save-verpflegung" class="button-save">Speichern</button>
		</div>
	`;

		// 🧩 Mapping der gespeicherten Metadaten auf Inputs
		const map = {
			"zn-kinder": meta.suppentag_znüni_kinder,
			"zn-erwachsene": meta.suppentag_znüni_erwachsene,
			"mi-kinder": meta.suppentag_mittag_kinder,
			"mi-erwachsene": meta.suppentag_mittag_erwachsene,
		};

		Object.entries(map).forEach(([id, val]) => {
			const el = document.getElementById(id);
			if (!el) return;
			el.value = val === null || val === undefined ? "" : val;
		});

		// ❌ Abbrechen → Modal schließen
		document.getElementById("cancel-verpflegung").addEventListener("click", () => {
			verpflegungModal.hidden = true;
		});

		// 💾 Speichern → Daten sichern + Modal schließen
		document.getElementById("save-verpflegung").addEventListener("click", async () => {
			// ⚙️ Strings statt Zahlen senden, damit REST-API keine Typfehler wirft
			const getValueOrEmpty = (id) => {
				const el = document.getElementById(id);
				return el.value === "" ? "" : el.value.trim(); // kein Number()!
			};

			const data = {
				suppentag_znüni_kinder: getValueOrEmpty("zn-kinder"),
				suppentag_znüni_erwachsene: getValueOrEmpty("zn-erwachsene"),
				suppentag_mittag_kinder: getValueOrEmpty("mi-kinder"),
				suppentag_mittag_erwachsene: getValueOrEmpty("mi-erwachsene"),
			};

			try {
				await apiFetch({
					path: `/wp/v2/ud-suppentag/${suppentagId}`,
					method: "POST",
					data: { meta: data },
				});

				console.log("[UD-Verpflegung] Daten gespeichert ✅");

				// Fortschrittsring direkt aktualisieren
				updateVerpflegungProgress(data);

				// Modal schließen
				verpflegungModal.hidden = true;
			} catch (err) {
				console.error("[UD-Verpflegung] Fehler beim Speichern:", err);
			}
		});

	}

	/* =====================================================
	   📦 Modal öffnen (erstellt Suppentag bei Bedarf)
	===================================================== */
	verpflegungBtn.addEventListener("click", async () => {
		const date = datePicker?.value || new Date().toISOString().split("T")[0];

		verpflegungModal.hidden = false;
		verpflegungLoading.hidden = false;
		verpflegungBody.hidden = true;

		try {
			const suppentagId = await ensureSuppentagExists(date);
			const suppentag = await apiFetch({
				path: `/wp/v2/ud-suppentag/${suppentagId}?_=${Date.now()}`,
			});

			renderVerpflegungForm(suppentagId, suppentag.meta || {}, date);
			verpflegungLoading.hidden = true;
			verpflegungBody.hidden = false;
			updateVerpflegungProgress(suppentag.meta || {});
		} catch (err) {
			console.error("[UD-Verpflegung] Fehler beim Öffnen:", err);
			verpflegungLoading.textContent = "Fehler beim Laden.";
		}
	});

	/* =====================================================
	   ❌ Modal schließen
	===================================================== */
	verpflegungClose?.addEventListener("click", () => (verpflegungModal.hidden = true));
	verpflegungBackdrop?.addEventListener("click", () => (verpflegungModal.hidden = true));
});
