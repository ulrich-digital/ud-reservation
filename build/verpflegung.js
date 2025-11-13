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

/***/ "./src/css/verpflegung.scss":
/*!**********************************!*\
  !*** ./src/css/verpflegung.scss ***!
  \**********************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

eval("{__webpack_require__.r(__webpack_exports__);\n// extracted by mini-css-extract-plugin\n\n\n//# sourceURL=webpack://udReservation/./src/css/verpflegung.scss?\n}");

/***/ }),

/***/ "./src/js/helpers/suppentag.js":
/*!*************************************!*\
  !*** ./src/js/helpers/suppentag.js ***!
  \*************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

eval("{__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   ensureSuppentagExists: function() { return /* binding */ ensureSuppentagExists; },\n/* harmony export */   getSuppentagById: function() { return /* binding */ getSuppentagById; },\n/* harmony export */   updateSuppentagMeta: function() { return /* binding */ updateSuppentagMeta; }\n/* harmony export */ });\n/* harmony import */ var _wordpress_api_fetch__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @wordpress/api-fetch */ \"@wordpress/api-fetch\");\n/* harmony import */ var _wordpress_api_fetch__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_wordpress_api_fetch__WEBPACK_IMPORTED_MODULE_0__);\n/**\r\n * UD Helper – Suppentag Verwaltung\r\n * ---------------------------------------------\r\n * Gemeinsame Hilfsfunktionen für alle Module (Produktion, Verpflegung etc.)\r\n * Bietet REST-kompatible Utilitys zur Prüfung und Erstellung von Suppentagen.\r\n */\n\n\n\n/**\r\n * Prüft, ob für ein bestimmtes Datum bereits ein Suppentag existiert.\r\n * Falls nicht vorhanden, wird automatisch ein neuer angelegt.\r\n * Wenn vorhanden, wird er zurückgegeben (keine Duplikate).\r\n *\r\n * @param {string} date - Datum im Format YYYY-MM-DD\r\n * @returns {Promise<number>} - ID des bestehenden oder neu erstellten Suppentags\r\n */\nasync function ensureSuppentagExists(date) {\n  try {\n    // 🔍 1. Exakte Abfrage über eigenen REST-Endpunkt\n    const result = await _wordpress_api_fetch__WEBPACK_IMPORTED_MODULE_0___default()({\n      path: `/ud/v1/suppentag-by-date?date=${date}`\n    });\n    if (result && Number(result.id) > 0) {\n      console.log(`✅ Suppentag für ${date} gefunden (ID ${result.id})`);\n      return result.id;\n    }\n\n    // 🆕 2. Wenn keiner existiert → neuen Suppentag anlegen\n    console.log(`🆕 Kein Suppentag für ${date} gefunden – wird erstellt...`);\n    const [year, month, day] = date.split(\"-\");\n    const formattedTitle = `Suppentag ${day}.${month}.${year}`;\n    const created = await _wordpress_api_fetch__WEBPACK_IMPORTED_MODULE_0___default()({\n      path: `/wp/v2/ud-suppentag`,\n      method: \"POST\",\n      data: {\n        title: formattedTitle,\n        status: \"publish\",\n        meta: {\n          suppentag_date: date\n        }\n      }\n    });\n    console.log(`📦 Neuer Suppentag erstellt (ID ${created.id})`);\n    return created.id;\n  } catch (error) {\n    console.error(\"[UD-Suppentag] Fehler bei ensureSuppentagExists:\", error);\n    throw error;\n  }\n}\n\n/**\r\n * Lädt einen bestehenden Suppentag inkl. Metadaten aus der REST-API.\r\n *\r\n * @param {number} id - Post ID des Suppentags\r\n * @returns {Promise<Object>} - Vollständiges Suppentag-Objekt mit Metadaten\r\n */\nasync function getSuppentagById(id) {\n  try {\n    if (!id || Number(id) <= 0) throw new Error(\"Ungültige Suppentag-ID\");\n    const suppentag = await _wordpress_api_fetch__WEBPACK_IMPORTED_MODULE_0___default()({\n      path: `/wp/v2/ud-suppentag/${id}?_=${Date.now()}`\n    });\n    return suppentag;\n  } catch (error) {\n    console.error(\"[UD-Suppentag] Fehler beim Laden:\", error);\n    throw error;\n  }\n}\n\n/**\r\n * Aktualisiert Metadaten eines bestehenden Suppentags.\r\n *\r\n * @param {number} id - ID des Suppentags\r\n * @param {Object} meta - Key/Value-Objekt mit zu aktualisierenden Metadaten\r\n * @returns {Promise<void>}\r\n */\nasync function updateSuppentagMeta(id, meta = {}) {\n  try {\n    if (!id || Number(id) <= 0) throw new Error(\"Ungültige Suppentag-ID\");\n    await _wordpress_api_fetch__WEBPACK_IMPORTED_MODULE_0___default()({\n      path: `/wp/v2/ud-suppentag/${id}`,\n      method: \"POST\",\n      data: {\n        meta\n      }\n    });\n    console.log(`[UD-Suppentag] Meta-Daten aktualisiert (ID ${id})`);\n  } catch (error) {\n    console.error(\"[UD-Suppentag] Fehler beim Aktualisieren:\", error);\n    throw error;\n  }\n}\n\n//# sourceURL=webpack://udReservation/./src/js/helpers/suppentag.js?\n}");

/***/ }),

/***/ "./src/js/verpflegung.js":
/*!*******************************!*\
  !*** ./src/js/verpflegung.js ***!
  \*******************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

eval("{__webpack_require__.r(__webpack_exports__);\n/* harmony import */ var _wordpress_api_fetch__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @wordpress/api-fetch */ \"@wordpress/api-fetch\");\n/* harmony import */ var _wordpress_api_fetch__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_wordpress_api_fetch__WEBPACK_IMPORTED_MODULE_0__);\n/* harmony import */ var _helpers_suppentag__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./helpers/suppentag */ \"./src/js/helpers/suppentag.js\");\n/* harmony import */ var _css_verpflegung_scss__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../css/verpflegung.scss */ \"./src/css/verpflegung.scss\");\n\n\n\nconsole.log(\"[UD-Verpflegung] Modul geladen ✅\");\ndocument.addEventListener(\"DOMContentLoaded\", () => {\n  const verpflegungBtn = document.getElementById(\"ud-start-verpflegung\");\n  const verpflegungModal = document.getElementById(\"ud-verpflegung-modal\");\n  const verpflegungBackdrop = verpflegungModal?.querySelector(\".ud-modal-backdrop\");\n  const verpflegungClose = verpflegungModal?.querySelector(\".ud-modal-close\");\n  const verpflegungBody = document.getElementById(\"ud-verpflegung-form\");\n  const verpflegungLoading = document.getElementById(\"ud-verpflegung-loading\");\n  const datePicker = document.getElementById(\"reservation-date\");\n  if (!verpflegungBtn || !verpflegungModal) return;\n\n  /* =====================================================\r\n     🔄 Fortschrittsring aktualisieren\r\n  ===================================================== */\n  function updateVerpflegungProgress(meta = {}) {\n    const ring = verpflegungBtn.querySelector(\".progress\");\n    const text = verpflegungBtn.querySelector(\".progress-text\");\n    const label = verpflegungBtn.querySelector(\".label\");\n    const keys = [\"suppentag_znüni_kinder\", \"suppentag_znüni_erwachsene\", \"suppentag_mittag_kinder\", \"suppentag_mittag_erwachsene\"];\n    const total = keys.length;\n    const erledigt = keys.filter(k => meta[k] !== null && meta[k] !== undefined && meta[k] !== \"\").length;\n    const percent = erledigt / total * 100;\n    const radius = 16;\n    const circumference = 2 * Math.PI * radius;\n    const offset = circumference - percent / 100 * circumference;\n    if (ring) {\n      ring.style.strokeDasharray = `${circumference}`;\n      ring.style.strokeDashoffset = offset.toFixed(2);\n      ring.style.opacity = erledigt > 0 ? \"1\" : \"0.3\";\n    }\n    if (text) text.textContent = `${erledigt} von ${total} erledigt`;\n    if (label) label.textContent = erledigt > 0 ? \"Verpflegung\" : \"Verpflegung\";\n  }\n\n  /* =====================================================\r\n     📦 Suppentag-Daten für Datum laden (ohne Erstellen)\r\n  ===================================================== */\n  async function loadVerpflegungDataForDate(date) {\n    if (!date) return;\n    try {\n      const response = await fetch(`/wp-json/ud/v1/suppentag-by-date?date=${date}`);\n      const data = await response.json();\n      if (data?.id && data.id > 0) {\n        const suppentag = await _wordpress_api_fetch__WEBPACK_IMPORTED_MODULE_0___default()({\n          path: `/wp/v2/ud-suppentag/${data.id}?_=${Date.now()}`\n        });\n        updateVerpflegungProgress(suppentag.meta || {});\n        console.log(`[UD-Verpflegung] Fortschritt geladen für ${date}`);\n      } else {\n        updateVerpflegungProgress({});\n        console.log(`[UD-Verpflegung] Kein Suppentag für ${date}`);\n      }\n    } catch (err) {\n      console.error(\"[UD-Verpflegung] Fehler beim Laden des Fortschritts:\", err);\n    }\n  }\n\n  /* =====================================================\r\n     🟢 Initial: beim Seitenstart laden\r\n  ===================================================== */\n  (async () => {\n    const date = datePicker?.value || new Date().toISOString().split(\"T\")[0];\n    await loadVerpflegungDataForDate(date);\n  })();\n\n  /* =====================================================\r\n     📅 Datum geändert → Fortschritt neu laden\r\n  ===================================================== */\n  datePicker?.addEventListener(\"change\", async () => {\n    const date = datePicker.value;\n    await loadVerpflegungDataForDate(date);\n  });\n\n  /* =====================================================\r\n     🧱 Formularaufbau – Version mit Textinputs (numeric inputmode)\r\n     🧩 Fix: leere Felder bleiben leer, kein \"0\"-Bug\r\n  ===================================================== */\n  function renderVerpflegungForm(suppentagId, meta, date) {\n    const d = new Date(date);\n    const wochentage = [\"So.\", \"Mo.\", \"Di.\", \"Mi.\", \"Do.\", \"Fr.\", \"Sa.\"];\n    const formattedDate = `${wochentage[d.getDay()]} ${d.getDate().toString().padStart(2, \"0\")}.${(d.getMonth() + 1).toString().padStart(2, \"0\")}.${d.getFullYear()}`;\n    verpflegungBody.innerHTML = `\n\t\t<h3 class=\"ud-modal-title\">Verpflegung vom ${formattedDate}</h3>\n\n\t\t<div class=\"verpflegung-group ud-inner-group\">\n\t\t\t<h4>Znüni</h4>\n\t\t\t<div class=\"rows\">\n\t\t\t\t<div class=\"row\">\n\t\t\t\t\t<label for=\"zn-kinder\">Kinder</label>\n\t\t\t\t\t<input type=\"text\" inputmode=\"numeric\" pattern=\"[0-9]*\" id=\"zn-kinder\">\n\t\t\t\t</div>\n\t\t\t\t<div class=\"row\">\n\t\t\t\t\t<label for=\"zn-erwachsene\">Erwachsene</label>\n\t\t\t\t\t<input type=\"text\" inputmode=\"numeric\" pattern=\"[0-9]*\" id=\"zn-erwachsene\">\n\t\t\t\t</div>\n\t\t\t</div>\n\t\t</div>\n\n\t\t<div class=\"verpflegung-group ud-inner-group\">\n\t\t\t<h4>Zmittag</h4>\n\t\t\t<div class=\"rows\">\n\t\t\t\t<div class=\"row\">\n\t\t\t\t\t<label for=\"mi-kinder\">Kinder</label>\n\t\t\t\t\t<input type=\"text\" inputmode=\"numeric\" pattern=\"[0-9]*\" id=\"mi-kinder\">\n\t\t\t\t</div>\n\t\t\t\t<div class=\"row\">\n\t\t\t\t\t<label for=\"mi-erwachsene\">Erwachsene</label>\n\t\t\t\t\t<input type=\"text\" inputmode=\"numeric\" pattern=\"[0-9]*\" id=\"mi-erwachsene\">\n\t\t\t\t</div>\n\t\t\t</div>\n\t\t</div>\n\n\t\t<div class=\"actions\">\n\t\t\t<button id=\"cancel-verpflegung\" class=\"button-cancel\">Abbrechen</button>\n\t\t\t<button id=\"save-verpflegung\" class=\"button-save\">Speichern</button>\n\t\t</div>\n\t`;\n\n    // 🧩 Mapping der gespeicherten Metadaten auf Inputs\n    const map = {\n      \"zn-kinder\": meta.suppentag_znüni_kinder,\n      \"zn-erwachsene\": meta.suppentag_znüni_erwachsene,\n      \"mi-kinder\": meta.suppentag_mittag_kinder,\n      \"mi-erwachsene\": meta.suppentag_mittag_erwachsene\n    };\n    Object.entries(map).forEach(([id, val]) => {\n      const el = document.getElementById(id);\n      if (!el) return;\n      el.value = val === null || val === undefined ? \"\" : val;\n    });\n\n    // ❌ Abbrechen → Modal schließen\n    document.getElementById(\"cancel-verpflegung\").addEventListener(\"click\", () => {\n      verpflegungModal.hidden = true;\n    });\n\n    // 💾 Speichern → Daten sichern + Modal schließen\n    document.getElementById(\"save-verpflegung\").addEventListener(\"click\", async () => {\n      // ⚙️ Strings statt Zahlen senden, damit REST-API keine Typfehler wirft\n      const getValueOrEmpty = id => {\n        const el = document.getElementById(id);\n        return el.value === \"\" ? \"\" : el.value.trim(); // kein Number()!\n      };\n      const data = {\n        suppentag_znüni_kinder: getValueOrEmpty(\"zn-kinder\"),\n        suppentag_znüni_erwachsene: getValueOrEmpty(\"zn-erwachsene\"),\n        suppentag_mittag_kinder: getValueOrEmpty(\"mi-kinder\"),\n        suppentag_mittag_erwachsene: getValueOrEmpty(\"mi-erwachsene\")\n      };\n      try {\n        await _wordpress_api_fetch__WEBPACK_IMPORTED_MODULE_0___default()({\n          path: `/wp/v2/ud-suppentag/${suppentagId}`,\n          method: \"POST\",\n          data: {\n            meta: data\n          }\n        });\n        console.log(\"[UD-Verpflegung] Daten gespeichert ✅\");\n\n        // Fortschrittsring direkt aktualisieren\n        updateVerpflegungProgress(data);\n\n        // Modal schließen\n        verpflegungModal.hidden = true;\n      } catch (err) {\n        console.error(\"[UD-Verpflegung] Fehler beim Speichern:\", err);\n      }\n    });\n  }\n\n  /* =====================================================\r\n     📦 Modal öffnen (erstellt Suppentag bei Bedarf)\r\n  ===================================================== */\n  verpflegungBtn.addEventListener(\"click\", async () => {\n    const date = datePicker?.value || new Date().toISOString().split(\"T\")[0];\n    verpflegungModal.hidden = false;\n    verpflegungLoading.hidden = false;\n    verpflegungBody.hidden = true;\n    try {\n      const suppentagId = await (0,_helpers_suppentag__WEBPACK_IMPORTED_MODULE_1__.ensureSuppentagExists)(date);\n      const suppentag = await _wordpress_api_fetch__WEBPACK_IMPORTED_MODULE_0___default()({\n        path: `/wp/v2/ud-suppentag/${suppentagId}?_=${Date.now()}`\n      });\n      renderVerpflegungForm(suppentagId, suppentag.meta || {}, date);\n      verpflegungLoading.hidden = true;\n      verpflegungBody.hidden = false;\n      updateVerpflegungProgress(suppentag.meta || {});\n    } catch (err) {\n      console.error(\"[UD-Verpflegung] Fehler beim Öffnen:\", err);\n      verpflegungLoading.textContent = \"Fehler beim Laden.\";\n    }\n  });\n\n  /* =====================================================\r\n     ❌ Modal schließen\r\n  ===================================================== */\n  verpflegungClose?.addEventListener(\"click\", () => verpflegungModal.hidden = true);\n  verpflegungBackdrop?.addEventListener(\"click\", () => verpflegungModal.hidden = true);\n});\n\n//# sourceURL=webpack://udReservation/./src/js/verpflegung.js?\n}");

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
/******/ 	var __webpack_exports__ = __webpack_require__("./src/js/verpflegung.js");
/******/ 	window.udReservation = __webpack_exports__;
/******/ 	
/******/ })()
;