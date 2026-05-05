# SDSU Maps — Release Notes

## v0.4.0 — Track D pins & locations (2026-05-02)

Closes #17, #18, #19 · Refs #24

### Changes

- **Campus pins: 2 → 12.** Added Storm Hall, PSFA, Hardy Tower, GMCS,
  Hepner Hall, ENS, Malcolm A. Love Library, EBA, Viejas Arena,
  Manchester Hall, Conrad Prebys Aztec Student Union, and Adams
  Humanities. Coordinates anchored to the Fall 2019 official campus map.
- **Pin details modal is now data-driven.** Tapping any pin shows that
  location's real name plus a one-line context note where it has one,
  instead of the previous hardcoded "Aztec Baseball Club / 3:30 – 5:30 pm".
- **New module `app/constants/locations.ts`.** Single source of truth for
  every campus reference (pin coordinates, display names, and the
  Firestore `event.location` join key). Exports `LocationId`,
  `LOCATIONS`, `LOCATION_LIST`, `isLocationId()`, `getLocationById()`.
- **Refactored `app/index.tsx`.** Two hardcoded markers replaced by a
  `LOCATION_LIST.map(...)` loop driving a single shared modal via
  `selectedPinId` state. Markers now center on their `(x, y)` instead of
  top-left anchoring.
- **Accessibility.** Every pin gets a ≥44pt hit area and an
  `accessibilityLabel` ("Open details for Hepner Hall"), so screen
  readers no longer announce unlabeled images.
- **New audit doc `docs/pins_list.txt`.** PinID | Location | x | y |
  Notes table for the full pin set.
