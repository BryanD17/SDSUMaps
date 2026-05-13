// Firestore read/write service for the `events` collection.
// Schema and field rationale: docs/DATA_SCHEMA.md.
//
// addEvent — A3. Validation duplicates AddEventModal on purpose: the form
// fails fast for the UI; the service is the last line of defense for any
// caller (tests, scripts, future code) that bypasses the form.
//
// getActiveEvents — A4. `endTime` IS the expiresAt field per the schema
// doc; querying it directly avoids the drift a mirror field would silently
// introduce.
import {
  Timestamp,
  addDoc,
  collection,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  where,
  type QuerySnapshot,
  type DocumentData,
} from "firebase/firestore";
import { isLocationId, type LocationId } from "../constants/locations";
import { auth, db } from "../utils/firebase";

const COLLECTION = "events";

const TITLE_MAX = 80;
const DESC_MAX = 500;
const CLUB_MAX = 60;

export type EventInput = {
  title: string;
  description: string;
  location: LocationId;
  clubName: string;
  startTime: Date;
  endTime: Date;
};

export type ActiveEvent = {
  id: string;
  title: string;
  description: string;
  location: LocationId;
  clubName: string;
  startTime: Date;
  endTime: Date;
};

function validate(input: EventInput): string | null {
  const title = input.title.trim();
  if (!title) return "Title is required.";
  if (title.length > TITLE_MAX) return `Title must be ${TITLE_MAX} characters or fewer.`;

  const description = input.description.trim();
  if (!description) return "Description is required.";
  if (description.length > DESC_MAX) return `Description must be ${DESC_MAX} characters or fewer.`;

  if (!input.location.trim()) return "Location is required.";
  if (!isLocationId(input.location)) return "Location must be a valid campus location.";

  const clubName = input.clubName.trim();
  if (!clubName) return "Club name is required.";
  if (clubName.length > CLUB_MAX) return `Club name must be ${CLUB_MAX} characters or fewer.`;

  if (!(input.startTime instanceof Date) || isNaN(input.startTime.getTime())) {
    return "Start time is invalid.";
  }
  if (!(input.endTime instanceof Date) || isNaN(input.endTime.getTime())) {
    return "End time is invalid.";
  }
  if (input.endTime.getTime() <= input.startTime.getTime()) {
    return "End time must be after start time.";
  }
  return null;
}

function mapDocs(snap: QuerySnapshot<DocumentData>): ActiveEvent[] {
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      title: data.title,
      description: data.description,
      location: data.location as LocationId,
      clubName: data.clubName,
      startTime: (data.startTime as Timestamp).toDate(),
      endTime: (data.endTime as Timestamp).toDate(),
    };
  });
}

export async function addEvent(input: EventInput): Promise<string> {
  const error = validate(input);
  if (error) throw new Error(error);

  const docRef = await addDoc(collection(db, COLLECTION), {
    title: input.title.trim(),
    description: input.description.trim(),
    location: input.location.trim(),
    clubName: input.clubName.trim(),
    startTime: Timestamp.fromDate(input.startTime),
    endTime: Timestamp.fromDate(input.endTime),
    createdAt: serverTimestamp(),
    createdBy: auth.currentUser?.uid ?? null,
  });
  return docRef.id;
}

export async function getActiveEvents(): Promise<ActiveEvent[]> {
  const q = query(
    collection(db, COLLECTION),
    where("endTime", ">", Timestamp.now()),
    orderBy("endTime", "asc"),
  );
  const snap = await getDocs(q);
  return mapDocs(snap);
}

export function subscribeToActiveEvents(
  onChange: (events: ActiveEvent[]) => void,
  onError?: (err: Error) => void,
): () => void {
  const q = query(
    collection(db, COLLECTION),
    where("endTime", ">", Timestamp.now()),
    orderBy("endTime", "asc"),
  );
  return onSnapshot(q, (snap) => onChange(mapDocs(snap)), onError);
}
