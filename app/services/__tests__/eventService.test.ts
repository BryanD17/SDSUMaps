// A6 — unit tests for the events service.
// We mock both firebase/firestore (to spy on calls without hitting a real DB)
// and ../utils/firebase (whose module-level init throws on missing env vars).
import type { LocationId } from "../../constants/locations";
import { addEvent, getActiveEvents } from "../eventService";
import { addDoc, getDocs, orderBy, where } from "firebase/firestore";

jest.mock("../../utils/firebase", () => ({
  db: {},
  auth: { currentUser: null },
  firebaseReady: true,
}));

jest.mock("firebase/firestore", () => ({
  Timestamp: {
    fromDate: (d: Date) => ({ toDate: () => d }),
    now: () => ({ toDate: () => new Date() }),
  },
  addDoc: jest.fn(),
  collection: jest.fn(() => ({})),
  getDocs: jest.fn(),
  orderBy: jest.fn(),
  query: jest.fn(() => ({})),
  serverTimestamp: jest.fn(() => "SERVER_TS"),
  where: jest.fn((field, op, val) => ({ field, op, val })),
}));

const future = (mins: number) => new Date(Date.now() + mins * 60_000);
const validInput = (): {
  title: string;
  description: string;
  location: LocationId;
  clubName: string;
  startTime: Date;
  endTime: Date;
} => ({
  title: "Aztec Baseball practice",
  description: "Open practice, all welcome.",
  location: "STUDENT_UNION",
  clubName: "Baseball Club",
  startTime: future(60),
  endTime: future(120),
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe("addEvent", () => {
  it("writes a doc and returns the id when input is valid", async () => {
    (addDoc as jest.Mock).mockResolvedValueOnce({ id: "abc123" });

    await expect(addEvent(validInput())).resolves.toBe("abc123");
    expect(addDoc).toHaveBeenCalledTimes(1);
  });

  it("rejects when endTime is not after startTime", async () => {
    const t = future(60);

    await expect(
      addEvent({ ...validInput(), startTime: t, endTime: t }),
    ).rejects.toThrow(/End time must be after start time/);
    expect(addDoc).not.toHaveBeenCalled();
  });

  it("rejects when title is empty", async () => {
    await expect(
      addEvent({ ...validInput(), title: "   " }),
    ).rejects.toThrow(/Title is required/);
    expect(addDoc).not.toHaveBeenCalled();
  });
});

describe("getActiveEvents", () => {
  it("queries with where('endTime', '>', now), ordered by endTime asc", async () => {
    (getDocs as jest.Mock).mockResolvedValueOnce({ docs: [] });

    await getActiveEvents();

    expect(where).toHaveBeenCalledWith("endTime", ">", expect.anything());
    expect(orderBy).toHaveBeenCalledWith("endTime", "asc");
  });

  it("maps Firestore docs to ActiveEvent[] with Date objects", async () => {
    const start = future(30);
    const end = future(90);
    (getDocs as jest.Mock).mockResolvedValueOnce({
      docs: [
        {
          id: "doc-1",
          data: () => ({
            title: "T",
            description: "D",
            location: "L",
            clubName: "C",
            startTime: { toDate: () => start },
            endTime: { toDate: () => end },
          }),
        },
      ],
    });

    const result = await getActiveEvents();

    expect(result).toEqual([
      {
        id: "doc-1",
        title: "T",
        description: "D",
        location: "L",
        clubName: "C",
        startTime: start,
        endTime: end,
      },
    ]);
  });
});
