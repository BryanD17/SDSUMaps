// Mock events used by the side menu / pin modals when Firestore is empty,
// offline, or in dev. Locations use `LocationId` values from
// `app/constants/locations.ts` so the per-pin filter works identically
// against mock and live data.
//
// Live Firestore data overrides this list; see `app/index.tsx` for the
// fetch + fallback sequence.
import type { Event } from "../components/EventList";

const today = (h: number, m: number) => {
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d;
};

const tomorrow = (h: number, m: number) => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(h, m, 0, 0);
  return d;
};

export const MOCK_EVENTS: Event[] = [
  {
    id: "mock-1",
    title: "Aztec Game Lab open hours",
    location: "STORM_HALL",
    clubName: "Aztec Game Lab",
    startTime: today(14, 0),
    endTime: today(17, 0),
  },
  {
    id: "mock-2",
    title: "Study Abroad info session",
    location: "STUDENT_UNION",
    clubName: "International Student Center",
    startTime: today(12, 0),
    endTime: today(13, 0),
  },
  {
    id: "mock-3",
    title: "SDSU Farmers Market",
    location: "STUDENT_UNION",
    startTime: today(10, 0),
    endTime: today(14, 0),
  },
  {
    id: "mock-4",
    title: "CS Club guest lecture",
    location: "GMCS",
    startTime: today(17, 0),
    endTime: today(18, 30),
  },
  {
    id: "mock-5",
    title: "Library extended hours",
    location: "LOVE_LIBRARY",
    startTime: tomorrow(8, 0),
    endTime: tomorrow(23, 59),
  },
];
