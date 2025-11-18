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

//console.log(`suppentag.js geladen ✅`);

// 🔒 interner Lock-Speicher
const suppentagLocks = new Map();

export async function ensureSuppentagExists(date) {

	// Wenn für dieses Datum bereits ein Request läuft → denselben Promise zurückgeben
	if (suppentagLocks.has(date)) {
		return suppentagLocks.get(date);
	}

	const promise = (async () => {
		try {
			// 1. Prüfen, ob Suppentag existiert
			const result = await apiFetch({
				path: `/ud/v1/suppentag-by-date?date=${date}`,
			});

			if (result && Number(result.id) > 0) {
				//console.log(`suppentag.js: ✔️ Suppentag existiert (ID ${result.id})`);
				return result.id;
			}

			// 2. Neuen Suppentag erstellen
			console.log(`suppentag.js: ➕ Erstelle neuen Suppentag für ${date}`);

			const [year, month, day] = date.split("-");
			const title = `Suppentag ${day}.${month}.${year}`;

			const created = await apiFetch({
				path: `/wp/v2/ud-suppentag`,
				method: "POST",
				data: {
					title,
					status: "publish",
					meta: { suppentag_date: date },
				},
			});

			console.log(`suppentag.js: 📦 Neuer Suppentag erstellt → ID ${created.id}`);
			return created.id;

		} finally {
			// Lock entfernen, aber erst *nach* Abschluss
			suppentagLocks.delete(date);
		}
	})();

	// Lock setzen
	suppentagLocks.set(date, promise);

	// Promise zurückgeben
	return promise;
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