/**
 * UD Helper – Suppentag Verwaltung
 * ---------------------------------------------
 * Gemeinsame Hilfsfunktionen für alle Module (Produktion, Verpflegung etc.)
 * Bietet REST-kompatible Utilitys zur Prüfung und Erstellung von Suppentagen.
 */

import apiFetch from "@wordpress/api-fetch";

/**
 * Prüft, ob für ein bestimmtes Datum bereits ein Suppentag existiert.
 * Falls nicht vorhanden, wird automatisch ein neuer angelegt.
 * Wenn vorhanden, wird er zurückgegeben (keine Duplikate).
 *
 * @param {string} date - Datum im Format YYYY-MM-DD
 * @returns {Promise<number>} - ID des bestehenden oder neu erstellten Suppentags
 */
export async function ensureSuppentagExists(date) {
	try {
		// 🔍 1. Exakte Abfrage über eigenen REST-Endpunkt
		const result = await apiFetch({ path: `/ud/v1/suppentag-by-date?date=${date}` });

		if (result && Number(result.id) > 0) {
			console.log(`✅ Suppentag für ${date} gefunden (ID ${result.id})`);
			return result.id;
		}

		// 🆕 2. Wenn keiner existiert → neuen Suppentag anlegen
		console.log(`🆕 Kein Suppentag für ${date} gefunden – wird erstellt...`);
		const [year, month, day] = date.split("-");
		const formattedTitle = `Suppentag ${day}.${month}.${year}`;

		const created = await apiFetch({
			path: `/wp/v2/ud-suppentag`,
			method: "POST",
			data: {
				title: formattedTitle,
				status: "publish",
				meta: { suppentag_date: date },
			},
		});

		console.log(`📦 Neuer Suppentag erstellt (ID ${created.id})`);
		return created.id;
	} catch (error) {
		console.error("[UD-Suppentag] Fehler bei ensureSuppentagExists:", error);
		throw error;
	}
}

/**
 * Lädt einen bestehenden Suppentag inkl. Metadaten aus der REST-API.
 *
 * @param {number} id - Post ID des Suppentags
 * @returns {Promise<Object>} - Vollständiges Suppentag-Objekt mit Metadaten
 */
export async function getSuppentagById(id) {
	try {
		if (!id || Number(id) <= 0) throw new Error("Ungültige Suppentag-ID");
		const suppentag = await apiFetch({
			path: `/wp/v2/ud-suppentag/${id}?_=${Date.now()}`,
		});
		return suppentag;
	} catch (error) {
		console.error("[UD-Suppentag] Fehler beim Laden:", error);
		throw error;
	}
}

/**
 * Aktualisiert Metadaten eines bestehenden Suppentags.
 *
 * @param {number} id - ID des Suppentags
 * @param {Object} meta - Key/Value-Objekt mit zu aktualisierenden Metadaten
 * @returns {Promise<void>}
 */
export async function updateSuppentagMeta(id, meta = {}) {
	try {
		if (!id || Number(id) <= 0) throw new Error("Ungültige Suppentag-ID");
		await apiFetch({
			path: `/wp/v2/ud-suppentag/${id}`,
			method: "POST",
			data: { meta },
		});
		console.log(`[UD-Suppentag] Meta-Daten aktualisiert (ID ${id})`);
	} catch (error) {
		console.error("[UD-Suppentag] Fehler beim Aktualisieren:", error);
		throw error;
	}
}