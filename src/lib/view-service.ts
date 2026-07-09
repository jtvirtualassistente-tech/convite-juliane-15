"use client";

import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  where,
} from "firebase/firestore";
import { EVENT_ID } from "@/lib/event";
import { getFirebaseClients, isFirebaseConfigured } from "@/lib/firebase";

export type InviteViewRecord = {
  id: string;
  eventId: string;
  visitorId: string;
  deviceType: "Celular" | "Tablet" | "Computador";
  userAgent: string;
  createdAt: string | null;
  lastSeenAt: string | null;
};

const visitorKey = "juliane-invite-visitor-id";

function getVisitorId() {
  const saved = window.localStorage.getItem(visitorKey);
  if (saved) return saved;

  const nextId =
    typeof window.crypto?.randomUUID === "function"
      ? window.crypto.randomUUID()
      : `visitor-${Date.now()}-${Math.random().toString(16).slice(2)}`;

  window.localStorage.setItem(visitorKey, nextId);
  return nextId;
}

function getDeviceType(): InviteViewRecord["deviceType"] {
  const agent = navigator.userAgent.toLowerCase();

  if (/ipad|tablet/.test(agent)) return "Tablet";
  if (/android|iphone|ipod|mobile/.test(agent)) return "Celular";
  return "Computador";
}

function toIso(value: unknown) {
  return value instanceof Timestamp ? value.toDate().toISOString() : null;
}

export async function trackInviteView() {
  if (typeof window === "undefined" || !isFirebaseConfigured()) return;

  const { db } = getFirebaseClients();
  const visitorId = getVisitorId();
  const viewRef = doc(db, "views", `${EVENT_ID}_${visitorId}`);
  const snapshot = await getDoc(viewRef);
  const baseData = {
    eventId: EVENT_ID,
    visitorId,
    deviceType: getDeviceType(),
    userAgent: navigator.userAgent.slice(0, 300),
    lastSeenAt: serverTimestamp(),
  };

  await setDoc(
    viewRef,
    snapshot.exists() ? baseData : { ...baseData, createdAt: serverTimestamp() },
    { merge: true },
  );
}

export async function listInviteViews(): Promise<InviteViewRecord[]> {
  if (!isFirebaseConfigured()) return [];

  const { db } = getFirebaseClients();
  const snapshot = await getDocs(
    query(collection(db, "views"), where("eventId", "==", EVENT_ID)),
  );

  return snapshot.docs.map((viewDoc) => {
    const data = viewDoc.data();
    const deviceType = String(data.deviceType ?? "Computador");

    return {
      id: viewDoc.id,
      eventId: String(data.eventId ?? EVENT_ID),
      visitorId: String(data.visitorId ?? viewDoc.id),
      deviceType:
        deviceType === "Celular" || deviceType === "Tablet"
          ? deviceType
          : "Computador",
      userAgent: String(data.userAgent ?? ""),
      createdAt: toIso(data.createdAt),
      lastSeenAt: toIso(data.lastSeenAt),
    };
  });
}
