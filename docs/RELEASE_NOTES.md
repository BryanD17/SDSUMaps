# SDSU Maps — Release Notes

## v0.5.0 — Live events & data contract fixes (2026-05-13)

### Changes

- **Real-time event sync.** Replaced the one-shot `getActiveEvents()`
  fetch with `subscribeToActiveEvents()` using Firestore `onSnapshot`.
  Adding an event now appears in the side menu and pin modals within a
  second — no app reload required.
- **`LocationId` contract enforced end-to-end.** The Add Event form now
  renders a location picker (web `<select>`, native `FlatList`-in-`Modal`)
  instead of a free-text input. The service-layer validator rejects
  non-`LocationId` strings, closing the `TODO(brandon)` in
  `eventService.ts`.
- **`description` and `clubName` rendered on event cards.** `EventList`
  now surfaces club name (caption) and a 2-line description where
  present.
- **Soft-fail Firebase init.** `app/utils/firebase.ts` no longer throws
  at module load when env vars are missing. A fresh clone without `.env`
  renders the campus map with mock data instead of crashing.
- **Test fixture repair.** `validInput().location` changed from
  `"Tony Gwynn Stadium"` to `"STUDENT_UNION"`. New tests cover
  `LocationId` rejection and `subscribeToActiveEvents`.

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
