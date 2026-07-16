"use client";

import {
  addDoc,
  collection,
  doc,
  deleteDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { EVENT_ID, eventInfo } from "@/lib/event";
import { getFirebaseClients, isFirebaseConfigured } from "@/lib/firebase";
import type { OpenRsvpPayload, OpenRsvpRecord } from "@/lib/types";
import { openRsvpSchema } from "@/lib/validation";

export type RsvpAdminUpdate = {
  name: string;
  phone: string;
  people: string[];
  status: OpenRsvpRecord["status"];
};

function localKey() {
  return "open-rsvps:juliane-15";
}

function normalizePeople(payload: OpenRsvpPayload) {
  const people = payload.willAttend
    ? payload.people.map((person) => person.trim()).filter(Boolean)
    : [];

  return people.length > 0 ? people : payload.willAttend ? [payload.name.trim()] : [];
}

function normalizeAdminPeople(name: string, people: string[]) {
  const holderName = name.trim();
  const seen = new Set<string>();

  return [holderName, ...people.map((person) => person.trim())].filter((person) => {
    const comparable = person.toLowerCase();
    if (!comparable || seen.has(comparable)) return false;
    seen.add(comparable);
    return true;
  });
}

export async function submitOpenRsvp(payload: OpenRsvpPayload) {
  const parsed = openRsvpSchema.parse(payload);
  const deadline = new Date(eventInfo.rsvpDeadlineIso).getTime();

  if (Date.now() > deadline) {
    throw new Error(
      "O período de confirmação online foi encerrado. Para mais informações, entre em contato com os organizadores da festa.",
    );
  }

  const people = normalizePeople(parsed);
  const record: OpenRsvpRecord = {
    id: `local-${Date.now()}`,
    eventId: EVENT_ID,
    name: parsed.name.trim(),
    phone: parsed.phone?.trim() ?? "",
    willAttend: parsed.willAttend,
    people,
    reviewed: parsed.reviewed,
    status: parsed.willAttend ? "confirmed" : "declined",
    totalPeople: people.length,
    createdAt: new Date().toISOString(),
  };

  if (!isFirebaseConfigured()) {
    const records = listLocalOpenRsvps();
    window.localStorage.setItem(localKey(), JSON.stringify([record, ...records]));
    return record;
  }

  const { db } = getFirebaseClients();
  const docRef = await addDoc(collection(db, "rsvps"), {
    eventId: EVENT_ID,
    name: record.name,
    phone: record.phone,
    willAttend: record.willAttend,
    people: record.people,
    status: record.status,
    totalPeople: record.totalPeople,
    createdAt: serverTimestamp(),
  });

  return { ...record, id: docRef.id };
}

export function listLocalOpenRsvps(): OpenRsvpRecord[] {
  if (typeof window === "undefined") return [];

  const saved = window.localStorage.getItem(localKey());
  if (!saved) return [];

  try {
    return JSON.parse(saved) as OpenRsvpRecord[];
  } catch {
    window.localStorage.removeItem(localKey());
    return [];
  }
}

export async function listOpenRsvps(): Promise<OpenRsvpRecord[]> {
  if (!isFirebaseConfigured()) return listLocalOpenRsvps();

  const { db } = getFirebaseClients();
  const snapshot = await getDocs(
    query(
      collection(db, "rsvps"),
      where("eventId", "==", EVENT_ID),
      orderBy("createdAt", "desc"),
    ),
  );

  return snapshot.docs.map((rsvpDoc) => {
    const data = rsvpDoc.data();
    return {
      id: rsvpDoc.id,
      eventId: String(data.eventId ?? EVENT_ID),
      name: String(data.name ?? ""),
      phone: String(data.phone ?? ""),
      willAttend: Boolean(data.willAttend),
      people: Array.isArray(data.people) ? data.people.map(String) : [],
      reviewed: true,
      status:
        data.status === "declined"
          ? "declined"
          : data.status === "no_show"
            ? "no_show"
            : "confirmed",
      totalPeople: Number(data.totalPeople ?? 0),
      createdAt:
        data.createdAt instanceof Timestamp
          ? data.createdAt.toDate().toISOString()
          : null,
    };
  });
}

export async function updateOpenRsvp(id: string, payload: RsvpAdminUpdate) {
  const nextPeople =
    payload.status === "confirmed"
      ? normalizeAdminPeople(payload.name, payload.people)
      : [];
  const nextRecord = {
    name: payload.name.trim(),
    phone: payload.phone.trim(),
    willAttend: payload.status === "confirmed",
    people: nextPeople,
    status: payload.status,
    totalPeople: payload.status === "confirmed" ? nextPeople.length : 0,
  };

  if (!isFirebaseConfigured()) {
    const records = listLocalOpenRsvps();
    window.localStorage.setItem(
      localKey(),
      JSON.stringify(
        records.map((record) =>
          record.id === id
            ? {
                ...record,
                ...nextRecord,
              }
            : record,
        ),
      ),
    );
    return;
  }

  const { db } = getFirebaseClients();
  await updateDoc(doc(db, "rsvps", id), nextRecord);
}

export async function deleteOpenRsvp(id: string) {
  if (!isFirebaseConfigured()) {
    const records = listLocalOpenRsvps();
    window.localStorage.setItem(
      localKey(),
      JSON.stringify(records.filter((record) => record.id !== id)),
    );
    return;
  }

  const { db } = getFirebaseClients();
  await deleteDoc(doc(db, "rsvps", id));
}
