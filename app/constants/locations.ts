// Single source of truth for SDSU campus locations.
//
// Why this file exists (Track D3): pin labels rendered on the map and the
// `event.location` strings persisted to Firestore must always agree, or the
// per-pin event filter (B4) silently returns nothing. Both sides of that
// join read from `LOCATIONS` here. Anything that needs to refer to a place
// on campus — pin coordinates, modal headers, Add Event location dropdown,
// EventList grouping — must import from this module instead of inlining
// strings.
//
// Schema contract: `LocationId` (the keys of `LOCATIONS`) is the value
// stored in Firestore as `event.location` (see docs/DATA_SCHEMA.md). The
// human-readable `name` is for UI only; never persist it.
//
// Coordinates: `(x, y)` are proportional fractions of the map image
// (0 = left/top, 1 = right/bottom). Read off the official SDSU Fall 2019
// printed campus map (aspect 2600:1727 ≈ 3:2). Because the placeholder
// asset shares that aspect ratio, these coordinates are valid for both
// the current placeholder and the higher-res asset Bryan will drop in
// (Track C). Re-tune only if a future asset changes aspect ratio.

export type LocationId =
  | 'HEPNER_HALL'
  | 'LOVE_LIBRARY'
  | 'STUDENT_UNION'
  | 'VIEJAS_ARENA'
  | 'GMCS'
  | 'ENS'
  | 'EBA'
  | 'STORM_HALL'
  | 'HARDY_TOWER'
  | 'MANCHESTER_HALL'
  | 'PSFA'
  | 'ADAMS_HUMANITIES';

export interface Location {
  /** Stable key. This is the value stored in Firestore as `event.location`
   *  and the type-safe handle used throughout the app. Never rename
   *  without a data migration. */
  id: LocationId;
  /** Display name shown in the pin details modal and EventList rows.
   *  Safe to refine for clarity — UI-only. */
  name: string;
  /** Horizontal position as a fraction of map width (0 = left, 1 = right). */
  x: number;
  /** Vertical position as a fraction of map height (0 = top, 1 = bottom). */
  y: number;
  /** Optional one-line context for the pin details popup. */
  notes?: string;
}

// Order here drives draw order on the map (later entries render on top).
// Keep iconic / frequently-tapped pins last so they win z-order ties.
export const LOCATIONS: Record<LocationId, Location> = {
  STORM_HALL: {
    id: 'STORM_HALL',
    name: 'Storm Hall',
    x: 0.35,
    y: 0.27,
  },
  PSFA: {
    id: 'PSFA',
    name: 'Professional Studies & Fine Arts (PSFA)',
    x: 0.42,
    y: 0.27,
  },
  HARDY_TOWER: {
    id: 'HARDY_TOWER',
    name: 'Hardy Tower',
    x: 0.49,
    y: 0.27,
    notes: 'Clock tower — campus landmark.',
  },
  GMCS: {
    id: 'GMCS',
    name: 'Geology, Math & Computer Science (GMCS)',
    x: 0.72,
    y: 0.28,
  },
  HEPNER_HALL: {
    id: 'HEPNER_HALL',
    name: 'Hepner Hall',
    x: 0.51,
    y: 0.34,
    notes: 'Iconic SDSU dome — center of the historic core.',
  },
  ENS: {
    id: 'ENS',
    name: 'Exercise & Nutritional Sciences (ENS)',
    x: 0.42,
    y: 0.42,
  },
  LOVE_LIBRARY: {
    id: 'LOVE_LIBRARY',
    name: 'Malcolm A. Love Library',
    x: 0.56,
    y: 0.47,
    notes: 'Main library — 24/5 during finals.',
  },
  EBA: {
    id: 'EBA',
    name: 'Education & Business Administration (EBA)',
    x: 0.76,
    y: 0.50,
  },
  VIEJAS_ARENA: {
    id: 'VIEJAS_ARENA',
    name: 'Viejas Arena',
    x: 0.35,
    y: 0.53,
    notes: 'Basketball, concerts, large events.',
  },
  MANCHESTER_HALL: {
    id: 'MANCHESTER_HALL',
    name: 'Manchester Hall',
    x: 0.63,
    y: 0.54,
  },
  STUDENT_UNION: {
    id: 'STUDENT_UNION',
    name: 'Conrad Prebys Aztec Student Union',
    x: 0.65,
    y: 0.59,
    notes: 'Dining, study lounges, student org offices.',
  },
  ADAMS_HUMANITIES: {
    id: 'ADAMS_HUMANITIES',
    name: 'Adams Humanities (AH)',
    x: 0.59,
    y: 0.62,
  },
};

/** Iteration-friendly view of `LOCATIONS`. Use this when rendering pins
 *  or building a location <Picker>; use the keyed object when you have
 *  a `LocationId` in hand. */
export const LOCATION_LIST: readonly Location[] = Object.values(LOCATIONS);

/** Type guard: is the given string a valid LocationId? Useful for
 *  validating Firestore reads / Add Event form input before trusting
 *  the value as a `LocationId`. */
export function isLocationId(value: string): value is LocationId {
  return Object.prototype.hasOwnProperty.call(LOCATIONS, value);
}

/** Lookup by id with `undefined` fallback. Prefer this over `LOCATIONS[id]`
 *  when `id` came from outside the type system (network, AsyncStorage). */
export function getLocationById(id: string): Location | undefined {
  return isLocationId(id) ? LOCATIONS[id] : undefined;
}
