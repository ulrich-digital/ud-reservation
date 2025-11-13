# UD Plugin: Reservation

Frontend-Reservierungssystem mit Tagesmenü-Integration („Suppentag“), Echtzeit-Synchronisation und Kiosk-Modus.
Entwickelt für gastronomische Einrichtungen wie die Suppenanstalt Schwyz – vollständig Gutenberg- und REST-basiert.



## Funktionen

- **Gutenberg-Block „UD Reservation“**
  Erzeugt ein modernes Frontend-Formular für Reservationen mit Live-Validierung und REST-Anbindung.

- **Echtzeit-Kommunikation (Ably)**
  Reservationen, Auslastung und Tagesmenüs werden ohne Seiten-Reload aktualisiert.

- **Kiosk-Modus**
  Vollbildanzeige mit automatischer Rotation zwischen Menü-Bild und Reservationen.

- **Admin-Tools**
  - Übersicht aller Reservationen
  - Schnellbearbeitung ohne Einzel-Edit
  - Ajax-basierter Sold-Out-Schalter
  - Zusätzliche Spalten (Datum, Personen, Status)

- **REST-API**
  - `/ud-reservation/v1/soldout` – Ausverkauft-Status
  - `/ud-reservation/v1/soup` – Tagesmenü

- **Technische Highlights**
  - Flatpickr mit deutscher Lokalisierung
  - `@wordpress/scripts`-Build (Webpack 5, SCSS → CSS, ESNext)
  - FSE-kompatibel mit Theme `ulrichdigital_block_theme`




## Screenshots

![Frontend-Ansicht](./assets/ud-reservation.webp)
*Eine Mitarbeiterin an der Rezeption verwaltet digitale Reservationen direkt am Tablet. Die Anzeige im Hintergrund zeigt den aktuellen Buchungsstatus in Echtzeit.*

![Editor-Ansicht](./assets/ud-reservation_reservation.webp)
*Übersicht über alle Reservationen im Frontend.*

![Editor-Ansicht](./assets/ud-reservation_hinzufuegen.webp)
*Reservationen im Frontend hinzufügen und bearbeiten.*

![Editor-Ansicht](./assets/ud-reservation_statistik.webp)
*Erfassung von Produktion, Lieferung und Verkauf.*

![Editor-Ansicht](./assets/ud-reservation_mockup.webp)
*Automatische Anzeige der aktuellen Reservationen und Tagesmenüs in Echtzeit.*




## Installation

1. Repository in den Plugin-Ordner von WordPress kopieren:
   `/wp-content/plugins/ud-reservation/`
2. Plugin im WordPress-Backend aktivieren.
3. Gutenberg-Block **„UD Reservation“** im Seiten- oder Beitragseditor hinzufügen.
4. Suppentags-Informationen im Backend hinterlegen (Bild, Beschreibung, Status).
5. Optional: Kiosk- oder Produktions-Ansicht über eigene Seiten/Shortcodes einbinden.



## Anforderungen

- WordPress 6.7 oder neuer
- PHP 8.0+
- Aktives Theme: `ulrichdigital_block_theme`
- Ably-API-Key für Echtzeit-Übertragung



## Autor

[ulrich.digital gmbh](https://ulrich.digital)



## Lizenz

Alle Rechte vorbehalten. Dieses Plugin ist urheberrechtlich geschützt und darf ohne ausdrückliche schriftliche Genehmigung der **ulrich.digital gmbh** weder kopiert, verbreitet, verändert noch weiterverwendet werden.
