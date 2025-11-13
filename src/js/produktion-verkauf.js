import apiFetch from "@wordpress/api-fetch";
import { ensureSuppentagExists } from "./helpers/suppentag";
import "../css/produktion-verkauf.scss";

console.log("[UD-Produktion] Modul geladen ✅");


/* =====================================================
   🏭 Produktion + Verkauf – Statistik-Modal
===================================================== */
const produktionBtn = document.getElementById("ud-start-produktion");
const produktionModal = document.getElementById("ud-produktion-modal");
const produktionBackdrop = produktionModal?.querySelector(".ud-modal-backdrop");
const produktionClose = produktionModal?.querySelector(".ud-produktion-modal-close");
const produktionBody = document.getElementById("ud-produktion-form");
const produktionLoading = document.getElementById("ud-produktion-loading");

// 🔹 Fortschrittsanzeige aktualisieren
function updateProgressRing(lieferanten = []) {
	const btn = document.getElementById("ud-start-produktion");
	if (!btn) return;

	const ring = btn.querySelector(".progress");
	const text = btn.querySelector(".progress-text");

	const total = lieferanten.length;
	const erledigt = lieferanten.filter((l) => Number(l.verkauf || 0) > 0).length;

	const percent = total > 0 ? (erledigt / total) * 100 : 0;
	const radius = 16;
	const circumference = 2 * Math.PI * radius;
	const offset = circumference - (percent / 100) * circumference;

	ring.style.strokeDasharray = `${circumference}`;
	ring.style.strokeDashoffset = offset.toFixed(2);
	text.textContent = `${erledigt} von ${total} erledigt`;
}

if (produktionBtn) {

	// 🟢 Beim Laden der Seite sofort Fortschrittsring aktualisieren
	(async () => {
		try {
			const dateInput = document.getElementById("reservation-date");
			const date = dateInput?.value || new Date().toISOString().split("T")[0];

			// Falls kein Suppentag existiert, wird er erstellt
			const suppentagId = await ensureSuppentagExists(date);

			const suppentag = await apiFetch({
				path: `/wp/v2/ud-suppentag/${suppentagId}?_=${Date.now()}`,
			});

			const lieferanten = Array.isArray(suppentag.meta?.suppentag_produktion)
				? suppentag.meta.suppentag_produktion
				: [];

			updateProgressRing(lieferanten);
			console.log("[UD-Produktion] Fortschritt beim Seitenstart aktualisiert");
		} catch (err) {
			console.warn("[UD-Produktion] Fortschritts-Init übersprungen:", err);
		}
	})();

	// 🖱 Klick-Event → Modal öffnen + Fortschritt erneut laden
	produktionBtn.addEventListener("click", async () => {
		const dateInput = document.getElementById("reservation-date");
		const date = dateInput?.value || new Date().toISOString().split("T")[0];
		console.log(`📅 Aktuell gewähltes Datum: ${date}`);

		produktionModal.hidden = false;
		produktionLoading.hidden = false;
		produktionBody.hidden = true;
		produktionBody.innerHTML = "";

		try {
			const suppentagId = await ensureSuppentagExists(date);

			const suppentag = await apiFetch({
				path: `/wp/v2/ud-suppentag/${suppentagId}?_=${Date.now()}`,
			});
			const meta = suppentag.meta || {};
			const produktion = meta.produktion_gesamt || 0;
			const lieferanten = Array.isArray(meta.suppentag_produktion)
				? meta.suppentag_produktion
				: [];

			renderProduktionForm(suppentagId, produktion, lieferanten, date);
			produktionLoading.hidden = true;
			produktionBody.hidden = false;

			// 🔹 Nach dem Öffnen erneut Fortschritt aktualisieren
			updateProgressRing(lieferanten);
		} catch (err) {
			produktionLoading.textContent = "Fehler beim Laden.";
			console.error("[UD-Produktion] Fehler beim Öffnen:", err);
		}
	});
}

/* =====================================================
   🧱 Formularaufbau
===================================================== */
function renderProduktionForm(suppentagId, produktion, lieferanten, date) {
	const defaultLieferanten = ["Reichmuth", "Lüönd", "Schuler", "Spar", "Roman", "Suppenküche"];

	const d = new Date(date);
	const wochentage = ["So.", "Mo.", "Di.", "Mi.", "Do.", "Fr.", "Sa."];
	const formattedDate = `${wochentage[d.getDay()]} ${d.getDate().toString().padStart(2, "0")}.${(d.getMonth() + 1)
		.toString()
		.padStart(2, "0")}.${d.getFullYear()}`;

	if (!Array.isArray(lieferanten) || lieferanten.length === 0) {
		lieferanten = defaultLieferanten.map((name) => ({
			name,
			lieferung: 0,
			retouren: 0,
			verkauf: 0,
		}));
	}

	produktionBody.innerHTML = `
		<h3 class="ud-modal-title">Produktion und Verkauf vom ${formattedDate}</h3>
		<div class="verpflegung-group ud-inner-group">

			<div class="rows">
				<div class="produktion-gesamt row">
					<label>Produktion gesamt (l)</label>
					<input type="number" id="produktion-gesamt" value="${produktion || 0}" min="0">
				</div>
			</div>

			<table class="ud-produktion-table">
				<thead>
					<tr>
						<th>Lieferant</th>
						<th>Lieferung (l)</th>
						<th>Retouren (l)</th>
						<th>Verkauf (l)</th>
						<th></th>
					</tr>
				</thead>
				<tbody>
					${lieferanten
				.map(
					(l) => `
						<tr>
							<td>
								<select class="lieferant">
									<option value="">– Lieferant wählen –</option>
									${defaultLieferanten
							.map(
								(opt) =>
									`<option value="${opt}" ${l.name === opt ? "selected" : ""}>${opt}</option>`
							)
							.join("")}
									<option value="custom" ${l.name && !defaultLieferanten.includes(l.name)
							? "selected"
							: ""
						}>Anderer Lieferant…</option>
								</select>
								<input type="text" class="custom-lieferant" placeholder="Name eingeben"
									value="${!defaultLieferanten.includes(l.name) ? l.name || "" : ""}"
									style="${!defaultLieferanten.includes(l.name) && l.name
							? "display:block"
							: "display:none"
						}; margin-top:4px;">
							</td>
							<td><input type="number" class="lieferung" value="${l.lieferung || 0}" min="0"></td>
							<td><input type="number" class="retouren" value="${l.retouren || 0}" min="0"></td>
							<td class="verkauf-cell">
								<button type="button" class="calc-btn" title="Berechnen (Lieferung - Retouren)">
									<i class="fa-solid fa-calculator"></i>
								</button>
								<input type="number" class="verkauf" value="${l.verkauf || 0}" min="0">
							</td>
							<td class="remove-cell"><button class="remove ud-modal-close"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M6.4 19L5 17.6L10.6 12L5 6.4L6.4 5L12 10.6L17.6 5L19 6.4L13.4 12L19 17.6L17.6 19L12 13.4L6.4 19Z" fill="#B2B2B2"></path>
</svg></button></td>
						</tr>`
				)
				.join("")}
					<tr class="total-row">
						<td class="total-label"><strong>Total</strong></td>
						<td></td>
						<td class="total-retouren"><strong>0 l</strong></td>
						<td class="total-verkauf"><strong>0 l</strong></td>
						<td></td>
					</tr>
				</tbody>
			</table>
		</div>
		<div class="actions">
			<div class="left-actions">
				<button id="add-lieferant" class="button-add">+ Lieferant</button>
			</div>
			<div class="right-actions">
				<button id="cancel-produktion" class="button-cancel">Abbrechen</button>
				<button id="save-produktion" class="button-save">Speichern</button>
			</div>
		</div>
	`;

	const tbody = produktionBody.querySelector("tbody");

	// ➕ Neue Zeile hinzufügen
	produktionBody.querySelector("#add-lieferant").addEventListener("click", () => {
		const newRow = document.createElement("tr");
		newRow.innerHTML = `
			<td>
				<select class="lieferant">
					<option value="">– Lieferant wählen –</option>
					${defaultLieferanten.map((opt) => `<option>${opt}</option>`).join("")}
					<option value="custom">Anderer Lieferant…</option>
				</select>
				<input type="text" class="custom-lieferant" placeholder="Name eingeben" style="display:none; margin-top:4px;">
			</td>
			<td><input type="number" class="lieferung" min="0" value="0"></td>
			<td><input type="number" class="retouren" min="0" value="0"></td>
			<td class="verkauf-cell">
				<button type="button" class="calc-btn" title="Berechnen (Lieferung - Retouren)">
					<i class="fa-solid fa-calculator"></i>
				</button>
				<input type="number" class="verkauf" min="0" value="0">
			</td>
			<td><button class="remove">✕</button></td>
		`;
		tbody.insertBefore(newRow, tbody.querySelector(".total-row"));
		updateProduktionTotals();
		updateProgressRing(collectProduktionData());
	});

	// 🔢 Taschenrechner-Klick → Berechnen
	tbody.addEventListener("click", (e) => {
		if (e.target.closest(".calc-btn")) {
			const row = e.target.closest("tr");
			const lieferung = parseFloat(row.querySelector(".lieferung").value || 0);
			const retouren = parseFloat(row.querySelector(".retouren").value || 0);
			const verkaufField = row.querySelector(".verkauf");
			verkaufField.value = Math.max(lieferung - retouren, 0).toFixed(1);
			updateProduktionTotals();
			updateProgressRing(collectProduktionData());
		}

		if (e.target.classList.contains("remove")) {
			e.target.closest("tr").remove();
			updateProduktionTotals();
			updateProgressRing(collectProduktionData());
		}
	});

	tbody.addEventListener("input", () => {
		updateProduktionTotals();
		updateProgressRing(collectProduktionData());
	});

	produktionBody.querySelector("#cancel-produktion").addEventListener("click", () => {
		produktionModal.hidden = true;
	});

	produktionBody.querySelector("#save-produktion").addEventListener("click", async () => {
		const data = collectProduktionData();
		const produktionGesamt = Number(document.getElementById("produktion-gesamt")?.value || 0);

		try {
			await apiFetch({
				path: `/wp/v2/ud-suppentag/${suppentagId}`,
				method: "POST",
				data: {
					meta: {
						produktion_gesamt: produktionGesamt,
						suppentag_produktion: data,
					},
				},
			});
			updateProgressRing(data);
			produktionModal.hidden = true;
		} catch (err) {
			console.error("[UD-Produktion] Fehler beim Speichern:", err);
		}
	});

	updateProduktionTotals();
	updateProgressRing(lieferanten);
}

/* =====================================================
   🔢 Hilfsfunktionen
===================================================== */
function collectProduktionData() {
	const rows = [...document.querySelectorAll(".ud-produktion-table tbody tr:not(.total-row)")];
	return rows.map((r) => {
		const select = r.querySelector(".lieferant");
		const custom = r.querySelector(".custom-lieferant");
		const name = select.value === "custom" ? custom.value.trim() : select.value.trim();
		const lieferung = Number(r.querySelector(".lieferung").value) || 0;
		const retouren = Number(r.querySelector(".retouren").value) || 0;
		const verkauf = Number(r.querySelector(".verkauf").value) || Math.max(lieferung - retouren, 0);
		return { name, lieferung, retouren, verkauf };
	});
}

function updateProduktionTotals() {
	const data = collectProduktionData();
	const totalRetouren = data.reduce((s, l) => s + (l.retouren || 0), 0);
	const totalVerkauf = data.reduce((s, l) => s + (l.verkauf || 0), 0);
	document.querySelector(".total-retouren strong").textContent = `${totalRetouren.toFixed(1)} l`;
	document.querySelector(".total-verkauf strong").textContent = `${totalVerkauf.toFixed(1)} l`;
}

/* =====================================================
   ❌ Modal schließen
===================================================== */
produktionClose?.addEventListener("click", () => (produktionModal.hidden = true));
produktionBackdrop?.addEventListener("click", () => (produktionModal.hidden = true));
