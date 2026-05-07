// Pure helpers shared by the side menu and the per-pin events modal.
// Kept off the React components so the logic is unit-testable in plain
// `node` jest without an RN renderer (see app/utils/__tests__/eventFilter.test.ts).
//
// Schema contract: `event.location` is the `LocationId` key from
// `app/constants/locations.ts` (see docs/DATA_SCHEMA.md). Mock events use
// the same convention so the filter behaves identically against mock and
// live Firestore data.

import type { Event } from "../components/EventList";

/** Events whose `location` matches the given `LocationId`. Strict equality
 *  on the stable id (not the human-readable display name) so this works
 *  for both mock and Firestore data. */
export function filterEventsByLocation<T extends Event>(events: T[], locationId: string): T[] {
  return events.filter((e) => e.location === locationId);
}

/** Stable ascending sort by `startTime`. Returns a new array; does not
 *  mutate the input. */
export function sortEventsByStartTime<T extends Event>(events: T[]): T[] {
  return [...events].sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
}

/** First N events in start-time order. Used by the per-pin modal to
 *  show a small preview before "See All" opens the full side menu. */
export function topNEventsByStartTime<T extends Event>(events: T[], n: number): T[] {
  if (n <= 0) return [];
  return sortEventsByStartTime(events).slice(0, n);
}
