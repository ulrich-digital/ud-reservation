/*
 * ATTENTION: The "eval" devtool has been used (maybe by default in mode: "development").
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
/******/ (function() { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./src/css/produktion-verkauf.scss":
/*!*****************************************!*\
  !*** ./src/css/produktion-verkauf.scss ***!
  \*****************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

eval("{__webpack_require__.r(__webpack_exports__);\n// extracted by mini-css-extract-plugin\n\n\n//# sourceURL=webpack://udReservation/./src/css/produktion-verkauf.scss?\n}");

/***/ }),

/***/ "./src/js/helpers/suppentag.js":
/*!*************************************!*\
  !*** ./src/js/helpers/suppentag.js ***!
  \*************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

eval("{__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   ensureSuppentagExists: function() { return /* binding */ ensureSuppentagExists; },\n/* harmony export */   getSuppentagById: function() { return /* binding */ getSuppentagById; },\n/* harmony export */   updateSuppentagMeta: function() { return /* binding */ updateSuppentagMeta; }\n/* harmony export */ });\n/* harmony import */ var _wordpress_api_fetch__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @wordpress/api-fetch */ \"@wordpress/api-fetch\");\n/* harmony import */ var _wordpress_api_fetch__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_wordpress_api_fetch__WEBPACK_IMPORTED_MODULE_0__);\n/**\r\n * UD Helper – Suppentag Verwaltung\r\n * ---------------------------------------------\r\n * Gemeinsame Hilfsfunktionen für alle Module (Produktion, Verpflegung etc.)\r\n * Bietet REST-kompatible Utilitys zur Prüfung und Erstellung von Suppentagen.\r\n */\n\n\n\n/**\r\n * Prüft, ob für ein bestimmtes Datum bereits ein Suppentag existiert.\r\n * Falls nicht vorhanden, wird automatisch ein neuer angelegt.\r\n * Wenn vorhanden, wird er zurückgegeben (keine Duplikate).\r\n *\r\n * @param {string} date - Datum im Format YYYY-MM-DD\r\n * @returns {Promise<number>} - ID des bestehenden oder neu erstellten Suppentags\r\n */\nasync function ensureSuppentagExists(date) {\n  try {\n    // 🔍 1. Exakte Abfrage über eigenen REST-Endpunkt\n    const result = await _wordpress_api_fetch__WEBPACK_IMPORTED_MODULE_0___default()({\n      path: `/ud/v1/suppentag-by-date?date=${date}`\n    });\n    if (result && Number(result.id) > 0) {\n      console.log(`✅ Suppentag für ${date} gefunden (ID ${result.id})`);\n      return result.id;\n    }\n\n    // 🆕 2. Wenn keiner existiert → neuen Suppentag anlegen\n    console.log(`🆕 Kein Suppentag für ${date} gefunden – wird erstellt...`);\n    const [year, month, day] = date.split(\"-\");\n    const formattedTitle = `Suppentag ${day}.${month}.${year}`;\n    const created = await _wordpress_api_fetch__WEBPACK_IMPORTED_MODULE_0___default()({\n      path: `/wp/v2/ud-suppentag`,\n      method: \"POST\",\n      data: {\n        title: formattedTitle,\n        status: \"publish\",\n        meta: {\n          suppentag_date: date\n        }\n      }\n    });\n    console.log(`📦 Neuer Suppentag erstellt (ID ${created.id})`);\n    return created.id;\n  } catch (error) {\n    console.error(\"[UD-Suppentag] Fehler bei ensureSuppentagExists:\", error);\n    throw error;\n  }\n}\n\n/**\r\n * Lädt einen bestehenden Suppentag inkl. Metadaten aus der REST-API.\r\n *\r\n * @param {number} id - Post ID des Suppentags\r\n * @returns {Promise<Object>} - Vollständiges Suppentag-Objekt mit Metadaten\r\n */\nasync function getSuppentagById(id) {\n  try {\n    if (!id || Number(id) <= 0) throw new Error(\"Ungültige Suppentag-ID\");\n    const suppentag = await _wordpress_api_fetch__WEBPACK_IMPORTED_MODULE_0___default()({\n      path: `/wp/v2/ud-suppentag/${id}?_=${Date.now()}`\n    });\n    return suppentag;\n  } catch (error) {\n    console.error(\"[UD-Suppentag] Fehler beim Laden:\", error);\n    throw error;\n  }\n}\n\n/**\r\n * Aktualisiert Metadaten eines bestehenden Suppentags.\r\n *\r\n * @param {number} id - ID des Suppentags\r\n * @param {Object} meta - Key/Value-Objekt mit zu aktualisierenden Metadaten\r\n * @returns {Promise<void>}\r\n */\nasync function updateSuppentagMeta(id, meta = {}) {\n  try {\n    if (!id || Number(id) <= 0) throw new Error(\"Ungültige Suppentag-ID\");\n    await _wordpress_api_fetch__WEBPACK_IMPORTED_MODULE_0___default()({\n      path: `/wp/v2/ud-suppentag/${id}`,\n      method: \"POST\",\n      data: {\n        meta\n      }\n    });\n    console.log(`[UD-Suppentag] Meta-Daten aktualisiert (ID ${id})`);\n  } catch (error) {\n    console.error(\"[UD-Suppentag] Fehler beim Aktualisieren:\", error);\n    throw error;\n  }\n}\n\n//# sourceURL=webpack://udReservation/./src/js/helpers/suppentag.js?\n}");

/***/ }),

/***/ "./src/js/produktion-verkauf.js":
/*!**************************************!*\
  !*** ./src/js/produktion-verkauf.js ***!
  \**************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

eval("{__webpack_require__.r(__webpack_exports__);\n/* harmony import */ var _wordpress_api_fetch__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @wordpress/api-fetch */ \"@wordpress/api-fetch\");\n/* harmony import */ var _wordpress_api_fetch__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_wordpress_api_fetch__WEBPACK_IMPORTED_MODULE_0__);\n/* harmony import */ var _helpers_suppentag__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./helpers/suppentag */ \"./src/js/helpers/suppentag.js\");\n/* harmony import */ var _css_produktion_verkauf_scss__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../css/produktion-verkauf.scss */ \"./src/css/produktion-verkauf.scss\");\n\n\n\nconsole.log(\"[UD-Produktion] Modul geladen ✅\");\n\n/* =====================================================\r\n   🏭 Produktion + Verkauf – Statistik-Modal\r\n===================================================== */\nconst produktionBtn = document.getElementById(\"ud-start-produktion\");\nconst produktionModal = document.getElementById(\"ud-produktion-modal\");\nconst produktionBackdrop = produktionModal?.querySelector(\".ud-modal-backdrop\");\nconst produktionClose = produktionModal?.querySelector(\".ud-produktion-modal-close\");\nconst produktionBody = document.getElementById(\"ud-produktion-form\");\nconst produktionLoading = document.getElementById(\"ud-produktion-loading\");\n\n// 🔹 Fortschrittsanzeige aktualisieren\nfunction updateProgressRing(lieferanten = []) {\n  const btn = document.getElementById(\"ud-start-produktion\");\n  if (!btn) return;\n  const ring = btn.querySelector(\".progress\");\n  const text = btn.querySelector(\".progress-text\");\n  const total = lieferanten.length;\n  const erledigt = lieferanten.filter(l => Number(l.verkauf || 0) > 0).length;\n  const percent = total > 0 ? erledigt / total * 100 : 0;\n  const radius = 16;\n  const circumference = 2 * Math.PI * radius;\n  const offset = circumference - percent / 100 * circumference;\n  ring.style.strokeDasharray = `${circumference}`;\n  ring.style.strokeDashoffset = offset.toFixed(2);\n  text.textContent = `${erledigt} von ${total} erledigt`;\n}\nif (produktionBtn) {\n  // 🟢 Beim Laden der Seite sofort Fortschrittsring aktualisieren\n  (async () => {\n    try {\n      const dateInput = document.getElementById(\"reservation-date\");\n      const date = dateInput?.value || new Date().toISOString().split(\"T\")[0];\n\n      // Falls kein Suppentag existiert, wird er erstellt\n      const suppentagId = await (0,_helpers_suppentag__WEBPACK_IMPORTED_MODULE_1__.ensureSuppentagExists)(date);\n      const suppentag = await _wordpress_api_fetch__WEBPACK_IMPORTED_MODULE_0___default()({\n        path: `/wp/v2/ud-suppentag/${suppentagId}?_=${Date.now()}`\n      });\n      const lieferanten = Array.isArray(suppentag.meta?.suppentag_produktion) ? suppentag.meta.suppentag_produktion : [];\n      updateProgressRing(lieferanten);\n      console.log(\"[UD-Produktion] Fortschritt beim Seitenstart aktualisiert\");\n    } catch (err) {\n      console.warn(\"[UD-Produktion] Fortschritts-Init übersprungen:\", err);\n    }\n  })();\n\n  // 🖱 Klick-Event → Modal öffnen + Fortschritt erneut laden\n  produktionBtn.addEventListener(\"click\", async () => {\n    const dateInput = document.getElementById(\"reservation-date\");\n    const date = dateInput?.value || new Date().toISOString().split(\"T\")[0];\n    console.log(`📅 Aktuell gewähltes Datum: ${date}`);\n    produktionModal.hidden = false;\n    produktionLoading.hidden = false;\n    produktionBody.hidden = true;\n    produktionBody.innerHTML = \"\";\n    try {\n      const suppentagId = await (0,_helpers_suppentag__WEBPACK_IMPORTED_MODULE_1__.ensureSuppentagExists)(date);\n      const suppentag = await _wordpress_api_fetch__WEBPACK_IMPORTED_MODULE_0___default()({\n        path: `/wp/v2/ud-suppentag/${suppentagId}?_=${Date.now()}`\n      });\n      const meta = suppentag.meta || {};\n      const produktion = meta.produktion_gesamt || 0;\n      const lieferanten = Array.isArray(meta.suppentag_produktion) ? meta.suppentag_produktion : [];\n      renderProduktionForm(suppentagId, produktion, lieferanten, date);\n      produktionLoading.hidden = true;\n      produktionBody.hidden = false;\n\n      // 🔹 Nach dem Öffnen erneut Fortschritt aktualisieren\n      updateProgressRing(lieferanten);\n    } catch (err) {\n      produktionLoading.textContent = \"Fehler beim Laden.\";\n      console.error(\"[UD-Produktion] Fehler beim Öffnen:\", err);\n    }\n  });\n}\n\n/* =====================================================\r\n   🧱 Formularaufbau\r\n===================================================== */\nfunction renderProduktionForm(suppentagId, produktion, lieferanten, date) {\n  const defaultLieferanten = [\"Reichmuth\", \"Lüönd\", \"Schuler\", \"Spar\", \"Roman\", \"Suppenküche\"];\n  const d = new Date(date);\n  const wochentage = [\"So.\", \"Mo.\", \"Di.\", \"Mi.\", \"Do.\", \"Fr.\", \"Sa.\"];\n  const formattedDate = `${wochentage[d.getDay()]} ${d.getDate().toString().padStart(2, \"0\")}.${(d.getMonth() + 1).toString().padStart(2, \"0\")}.${d.getFullYear()}`;\n  if (!Array.isArray(lieferanten) || lieferanten.length === 0) {\n    lieferanten = defaultLieferanten.map(name => ({\n      name,\n      lieferung: 0,\n      retouren: 0,\n      verkauf: 0\n    }));\n  }\n  produktionBody.innerHTML = `\n\t\t<h3 class=\"ud-modal-title\">Produktion und Verkauf vom ${formattedDate}</h3>\n\t\t<div class=\"verpflegung-group ud-inner-group\">\n\n\t\t\t<div class=\"rows\">\n\t\t\t\t<div class=\"produktion-gesamt row\">\n\t\t\t\t\t<label>Produktion gesamt (l)</label>\n\t\t\t\t\t<input type=\"number\" id=\"produktion-gesamt\" value=\"${produktion || 0}\" min=\"0\">\n\t\t\t\t</div>\n\t\t\t</div>\n\n\t\t\t<table class=\"ud-produktion-table\">\n\t\t\t\t<thead>\n\t\t\t\t\t<tr>\n\t\t\t\t\t\t<th>Lieferant</th>\n\t\t\t\t\t\t<th>Lieferung (l)</th>\n\t\t\t\t\t\t<th>Retouren (l)</th>\n\t\t\t\t\t\t<th>Verkauf (l)</th>\n\t\t\t\t\t\t<th></th>\n\t\t\t\t\t</tr>\n\t\t\t\t</thead>\n\t\t\t\t<tbody>\n\t\t\t\t\t${lieferanten.map(l => `\n\t\t\t\t\t\t<tr>\n\t\t\t\t\t\t\t<td>\n\t\t\t\t\t\t\t\t<select class=\"lieferant\">\n\t\t\t\t\t\t\t\t\t<option value=\"\">– Lieferant wählen –</option>\n\t\t\t\t\t\t\t\t\t${defaultLieferanten.map(opt => `<option value=\"${opt}\" ${l.name === opt ? \"selected\" : \"\"}>${opt}</option>`).join(\"\")}\n\t\t\t\t\t\t\t\t\t<option value=\"custom\" ${l.name && !defaultLieferanten.includes(l.name) ? \"selected\" : \"\"}>Anderer Lieferant…</option>\n\t\t\t\t\t\t\t\t</select>\n\t\t\t\t\t\t\t\t<input type=\"text\" class=\"custom-lieferant\" placeholder=\"Name eingeben\"\n\t\t\t\t\t\t\t\t\tvalue=\"${!defaultLieferanten.includes(l.name) ? l.name || \"\" : \"\"}\"\n\t\t\t\t\t\t\t\t\tstyle=\"${!defaultLieferanten.includes(l.name) && l.name ? \"display:block\" : \"display:none\"}; margin-top:4px;\">\n\t\t\t\t\t\t\t</td>\n\t\t\t\t\t\t\t<td><input type=\"number\" class=\"lieferung\" value=\"${l.lieferung || 0}\" min=\"0\"></td>\n\t\t\t\t\t\t\t<td><input type=\"number\" class=\"retouren\" value=\"${l.retouren || 0}\" min=\"0\"></td>\n\t\t\t\t\t\t\t<td class=\"verkauf-cell\">\n\t\t\t\t\t\t\t\t<button type=\"button\" class=\"calc-btn\" title=\"Berechnen (Lieferung - Retouren)\">\n\t\t\t\t\t\t\t\t\t<i class=\"fa-solid fa-calculator\"></i>\n\t\t\t\t\t\t\t\t</button>\n\t\t\t\t\t\t\t\t<input type=\"number\" class=\"verkauf\" value=\"${l.verkauf || 0}\" min=\"0\">\n\t\t\t\t\t\t\t</td>\n\t\t\t\t\t\t\t<td class=\"remove-cell\"><button class=\"remove ud-modal-close\"><svg width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path d=\"M6.4 19L5 17.6L10.6 12L5 6.4L6.4 5L12 10.6L17.6 5L19 6.4L13.4 12L19 17.6L17.6 19L12 13.4L6.4 19Z\" fill=\"#B2B2B2\"></path>\n</svg></button></td>\n\t\t\t\t\t\t</tr>`).join(\"\")}\n\t\t\t\t\t<tr class=\"total-row\">\n\t\t\t\t\t\t<td class=\"total-label\"><strong>Total</strong></td>\n\t\t\t\t\t\t<td></td>\n\t\t\t\t\t\t<td class=\"total-retouren\"><strong>0 l</strong></td>\n\t\t\t\t\t\t<td class=\"total-verkauf\"><strong>0 l</strong></td>\n\t\t\t\t\t\t<td></td>\n\t\t\t\t\t</tr>\n\t\t\t\t</tbody>\n\t\t\t</table>\n\t\t</div>\n\t\t<div class=\"actions\">\n\t\t\t<div class=\"left-actions\">\n\t\t\t\t<button id=\"add-lieferant\" class=\"button-add\">+ Lieferant</button>\n\t\t\t</div>\n\t\t\t<div class=\"right-actions\">\n\t\t\t\t<button id=\"cancel-produktion\" class=\"button-cancel\">Abbrechen</button>\n\t\t\t\t<button id=\"save-produktion\" class=\"button-save\">Speichern</button>\n\t\t\t</div>\n\t\t</div>\n\t`;\n\n  /* =============================================================== *\\\r\n     Title\r\n  \\* =============================================================== */\n  // nach dem Einfügen von produktionBody.innerHTML ausführen:\n  const tableBody = produktionBody.querySelector(\".ud-produktion-table tbody\");\n\n  // Funktion: Zeile hervorheben, wenn Lieferant = Suppenküche\n  function updateSuppenkuecheRows() {\n    tableBody.querySelectorAll(\"tr\").forEach(row => {\n      const select = row.querySelector(\"select.lieferant\");\n      if (!select) return;\n      if (select.value === \"Suppenküche\") {\n        row.classList.add(\"is-suppenkueche\");\n      } else {\n        row.classList.remove(\"is-suppenkueche\");\n      }\n    });\n  }\n\n  // Initial prüfen nach Rendern\n  updateSuppenkuecheRows();\n\n  // Auf Änderungen reagieren\n  tableBody.addEventListener(\"change\", e => {\n    if (e.target.matches(\"select.lieferant\")) {\n      updateSuppenkuecheRows();\n    }\n  });\n  const tbody = produktionBody.querySelector(\"tbody\");\n\n  // ➕ Neue Zeile hinzufügen\n  produktionBody.querySelector(\"#add-lieferant\").addEventListener(\"click\", () => {\n    const newRow = document.createElement(\"tr\");\n    newRow.innerHTML = `\n\t\t\t<td>\n\t\t\t\t<select class=\"lieferant\">\n\t\t\t\t\t<option value=\"\">– Lieferant wählen –</option>\n\t\t\t\t\t${defaultLieferanten.map(opt => `<option>${opt}</option>`).join(\"\")}\n\t\t\t\t\t<option value=\"custom\">Anderer Lieferant…</option>\n\t\t\t\t</select>\n\t\t\t\t<input type=\"text\" class=\"custom-lieferant\" placeholder=\"Name eingeben\" style=\"display:none; margin-top:4px;\">\n\t\t\t</td>\n\t\t\t<td><input type=\"number\" class=\"lieferung\" min=\"0\" value=\"0\"></td>\n\t\t\t<td><input type=\"number\" class=\"retouren\" min=\"0\" value=\"0\"></td>\n\t\t\t<td class=\"verkauf-cell\">\n\t\t\t\t<button type=\"button\" class=\"calc-btn\" title=\"Berechnen (Lieferung - Retouren)\">\n\t\t\t\t\t<i class=\"fa-solid fa-calculator\"></i>\n\t\t\t\t</button>\n\t\t\t\t<input type=\"number\" class=\"verkauf\" min=\"0\" value=\"0\">\n\t\t\t</td>\n\t\t\t<td><button class=\"remove\">✕</button></td>\n\t\t`;\n    tbody.insertBefore(newRow, tbody.querySelector(\".total-row\"));\n    updateProduktionTotals();\n    updateProgressRing(collectProduktionData());\n  });\n\n  // 🔢 Taschenrechner-Klick → Berechnen\n  tbody.addEventListener(\"click\", e => {\n    if (e.target.closest(\".calc-btn\")) {\n      const row = e.target.closest(\"tr\");\n      const lieferung = parseFloat(row.querySelector(\".lieferung\").value || 0);\n      const retouren = parseFloat(row.querySelector(\".retouren\").value || 0);\n      const verkaufField = row.querySelector(\".verkauf\");\n      verkaufField.value = Math.max(lieferung - retouren, 0).toFixed(1);\n      updateProduktionTotals();\n      updateProgressRing(collectProduktionData());\n    }\n    if (e.target.classList.contains(\"remove\")) {\n      e.target.closest(\"tr\").remove();\n      updateProduktionTotals();\n      updateProgressRing(collectProduktionData());\n    }\n  });\n  tbody.addEventListener(\"input\", () => {\n    updateProduktionTotals();\n    updateProgressRing(collectProduktionData());\n  });\n  produktionBody.querySelector(\"#cancel-produktion\").addEventListener(\"click\", () => {\n    produktionModal.hidden = true;\n  });\n  produktionBody.querySelector(\"#save-produktion\").addEventListener(\"click\", async () => {\n    const data = collectProduktionData();\n    const produktionGesamt = Number(document.getElementById(\"produktion-gesamt\")?.value || 0);\n    try {\n      await _wordpress_api_fetch__WEBPACK_IMPORTED_MODULE_0___default()({\n        path: `/wp/v2/ud-suppentag/${suppentagId}`,\n        method: \"POST\",\n        data: {\n          meta: {\n            produktion_gesamt: produktionGesamt,\n            suppentag_produktion: data\n          }\n        }\n      });\n      updateProgressRing(data);\n      produktionModal.hidden = true;\n    } catch (err) {\n      console.error(\"[UD-Produktion] Fehler beim Speichern:\", err);\n    }\n  });\n  updateProduktionTotals();\n  updateProgressRing(lieferanten);\n}\n\n/* =====================================================\r\n   🔢 Hilfsfunktionen\r\n===================================================== */\nfunction collectProduktionData() {\n  const rows = [...document.querySelectorAll(\".ud-produktion-table tbody tr:not(.total-row)\")];\n  return rows.map(r => {\n    const select = r.querySelector(\".lieferant\");\n    const custom = r.querySelector(\".custom-lieferant\");\n    const name = select.value === \"custom\" ? custom.value.trim() : select.value.trim();\n    const lieferung = Number(r.querySelector(\".lieferung\").value) || 0;\n    const retouren = Number(r.querySelector(\".retouren\").value) || 0;\n    const verkauf = Number(r.querySelector(\".verkauf\").value) || Math.max(lieferung - retouren, 0);\n    return {\n      name,\n      lieferung,\n      retouren,\n      verkauf\n    };\n  });\n}\nfunction updateProduktionTotals() {\n  const data = collectProduktionData();\n  const totalRetouren = data.reduce((s, l) => s + (l.retouren || 0), 0);\n  const totalVerkauf = data.reduce((s, l) => s + (l.verkauf || 0), 0);\n  document.querySelector(\".total-retouren strong\").textContent = `${totalRetouren.toFixed(1)} l`;\n  document.querySelector(\".total-verkauf strong\").textContent = `${totalVerkauf.toFixed(1)} l`;\n}\n\n/* =====================================================\r\n   ❌ Modal schließen\r\n===================================================== */\nproduktionClose?.addEventListener(\"click\", () => produktionModal.hidden = true);\nproduktionBackdrop?.addEventListener(\"click\", () => produktionModal.hidden = true);\n\n//# sourceURL=webpack://udReservation/./src/js/produktion-verkauf.js?\n}");

/***/ }),

/***/ "@wordpress/api-fetch":
/*!**********************************!*\
  !*** external ["wp","apiFetch"] ***!
  \**********************************/
/***/ (function(module) {

module.exports = window["wp"]["apiFetch"];

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/compat get default export */
/******/ 	!function() {
/******/ 		// getDefaultExport function for compatibility with non-harmony modules
/******/ 		__webpack_require__.n = function(module) {
/******/ 			var getter = module && module.__esModule ?
/******/ 				function() { return module['default']; } :
/******/ 				function() { return module; };
/******/ 			__webpack_require__.d(getter, { a: getter });
/******/ 			return getter;
/******/ 		};
/******/ 	}();
/******/ 	
/******/ 	/* webpack/runtime/define property getters */
/******/ 	!function() {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = function(exports, definition) {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	}();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	!function() {
/******/ 		__webpack_require__.o = function(obj, prop) { return Object.prototype.hasOwnProperty.call(obj, prop); }
/******/ 	}();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	!function() {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = function(exports) {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	}();
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module can't be inlined because the eval devtool is used.
/******/ 	var __webpack_exports__ = __webpack_require__("./src/js/produktion-verkauf.js");
/******/ 	window.udReservation = __webpack_exports__;
/******/ 	
/******/ })()
;