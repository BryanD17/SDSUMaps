// B6 — pure-logic tests for the event filter / sort / top-N helpers shared
// by the side menu (full list) and the per-pin modal (filtered top 3).
//
// We test the shared helpers rather than EventList / SideMenu directly:
// component rendering tests need jest-expo + @testing-library/react-native
// (heavy setup, separate config), and the filter/sort logic is the only
// non-trivial behavior in those components anyway. The components
// themselves just delegate to these helpers.

import type { Event } from "../../components/EventList";
import {
  filterEventsByLocation,
  sortEventsByStartTime,
  topNEventsByStartTime,
} from "../eventFilter";

const makeEvent = (overrides: Partial<Event> & Pick<Event, "id" | "startTime">): Event => ({
  title: `Event ${overrides.id}`,
  location: "GMCS",
  endTime: new Date(overrides.startTime.getTime() + 60 * 60_000),
  ...overrides,
});

describe("filterEventsByLocation", () => {
  it("returns only events whose location matches the given LocationId", () => {
    const events = [
      makeEvent({ id: "a", startTime: new Date("2026-05-10T10:00:00Z"), location: "GMCS" }),
      makeEvent({ id: "b", startTime: new Date("2026-05-10T11:00:00Z"), location: "LOVE_LIBRARY" }),
      makeEvent({ id: "c", startTime: new Date("2026-05-10T12:00:00Z"), location: "GMCS" }),
    ];

    const result = filterEventsByLocation(events, "GMCS");

    expect(result).toHaveLength(2);
    expect(result.map((e) => e.id)).toEqual(["a", "c"]);
  });

  it("returns an empty array when no event matches", () => {
    const events = [
      makeEvent({ id: "a", startTime: new Date(), location: "GMCS" }),
      makeEvent({ id: "b", startTime: new Date(), location: "LOVE_LIBRARY" }),
    ];

    expect(filterEventsByLocation(events, "STORM_HALL")).toEqual([]);
  });

  it("does not mutate the input array", () => {
    const events = [makeEvent({ id: "a", startTime: new Date(), location: "GMCS" })];
    const before = [...events];

    filterEventsByLocation(events, "LOVE_LIBRARY");

    expect(events).toEqual(before);
  });

  it("matches by exact LocationId, not by display name (so live + mock data behave the same)", () => {
    const events = [
      makeEvent({ id: "a", startTime: new Date(), location: "STUDENT_UNION" }),
    ];

    // Display name should NOT match — only the stable id does.
    expect(filterEventsByLocation(events, "Conrad Prebys Aztec Student Union")).toEqual([]);
    expect(filterEventsByLocation(events, "STUDENT_UNION")).toHaveLength(1);
  });
});

describe("sortEventsByStartTime", () => {
  it("returns a new array sorted ascending by startTime", () => {
    const events = [
      makeEvent({ id: "late", startTime: new Date("2026-05-10T18:00:00Z") }),
      makeEvent({ id: "early", startTime: new Date("2026-05-10T08:00:00Z") }),
      makeEvent({ id: "mid", startTime: new Date("2026-05-10T13:00:00Z") }),
    ];

    const result = sortEventsByStartTime(events);

    expect(result.map((e) => e.id)).toEqual(["early", "mid", "late"]);
  });

  it("does not mutate the input array", () => {
    const events = [
      makeEvent({ id: "late", startTime: new Date("2026-05-10T18:00:00Z") }),
      makeEvent({ id: "early", startTime: new Date("2026-05-10T08:00:00Z") }),
    ];
    const beforeIds = events.map((e) => e.id);

    sortEventsByStartTime(events);

    expect(events.map((e) => e.id)).toEqual(beforeIds);
  });

  it("returns an empty array unchanged", () => {
    expect(sortEventsByStartTime([])).toEqual([]);
  });
});

describe("topNEventsByStartTime", () => {
  it("returns the first N events in ascending start-time order", () => {
    const events = [
      makeEvent({ id: "a", startTime: new Date("2026-05-10T18:00:00Z") }),
      makeEvent({ id: "b", startTime: new Date("2026-05-10T09:00:00Z") }),
      makeEvent({ id: "c", startTime: new Date("2026-05-10T15:00:00Z") }),
      makeEvent({ id: "d", startTime: new Date("2026-05-10T11:00:00Z") }),
    ];

    expect(topNEventsByStartTime(events, 2).map((e) => e.id)).toEqual(["b", "d"]);
  });

  it("returns all events when N exceeds the array length", () => {
    const events = [
      makeEvent({ id: "a", startTime: new Date("2026-05-10T08:00:00Z") }),
      makeEvent({ id: "b", startTime: new Date("2026-05-10T09:00:00Z") }),
    ];

    expect(topNEventsByStartTime(events, 10)).toHaveLength(2);
  });

  it("returns an empty array when N <= 0", () => {
    const events = [makeEvent({ id: "a", startTime: new Date() })];
    expect(topNEventsByStartTime(events, 0)).toEqual([]);
    expect(topNEventsByStartTime(events, -1)).toEqual([]);
  });
});
