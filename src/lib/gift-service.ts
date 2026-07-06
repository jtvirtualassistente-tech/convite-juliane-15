"use client";

import {
  addDoc,
  collection,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
  doc,
  Timestamp,
} from "firebase/firestore";
import { type AdminGift, deleteAdminGift, listAdminGifts, saveAdminGift } from "@/lib/admin-store";
import { EVENT_ID } from "@/lib/event";
import { getFirebaseClients, isFirebaseConfigured } from "@/lib/firebase";

type FirestoreGift = AdminGift & {
  eventId?: string;
  createdAt?: string | null;
  updatedAt?: string | null;
};

function normalizeGift(id: string, data: Record<string, unknown>): FirestoreGift {
  return {
    id,
    eventId: String(data.eventId ?? EVENT_ID),
    name: String(data.name ?? ""),
    category: String(data.category ?? "Outros"),
    description: String(data.description ?? ""),
    imageUrl: String(data.imageUrl ?? ""),
    linkUrl: String(data.linkUrl ?? ""),
    size: String(data.size ?? ""),
    color: String(data.color ?? ""),
    notes: String(data.notes ?? ""),
    priority: String(data.priority ?? "Normal"),
    active: data.active !== false,
    createdAt:
      data.createdAt instanceof Timestamp
        ? data.createdAt.toDate().toISOString()
        : null,
    updatedAt:
      data.updatedAt instanceof Timestamp
        ? data.updatedAt.toDate().toISOString()
        : null,
  };
}

export async function listGifts(): Promise<AdminGift[]> {
  if (!isFirebaseConfigured()) return listAdminGifts();

  const { db } = getFirebaseClients();
  const snapshot = await getDocs(
    query(
      collection(db, "gifts"),
      where("eventId", "==", EVENT_ID),
      where("active", "==", true),
    ),
  );

  return snapshot.docs
    .map((giftDoc) => normalizeGift(giftDoc.id, giftDoc.data()))
    .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
}

export async function createGift(gift: Omit<AdminGift, "id">): Promise<AdminGift> {
  if (!isFirebaseConfigured()) return saveAdminGift(gift);

  const { db } = getFirebaseClients();
  const docRef = await addDoc(collection(db, "gifts"), {
    eventId: EVENT_ID,
    name: gift.name.trim(),
    category: gift.category.trim() || "Outros",
    description: gift.description.trim(),
    imageUrl: gift.imageUrl.trim(),
    linkUrl: gift.linkUrl.trim(),
    size: gift.size.trim(),
    color: gift.color.trim(),
    notes: gift.notes.trim(),
    priority: gift.priority.trim() || "Normal",
    active: gift.active,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return { ...gift, id: docRef.id };
}

export async function removeGift(id: string) {
  if (!isFirebaseConfigured()) {
    deleteAdminGift(id);
    return;
  }

  const { db } = getFirebaseClients();
  await updateDoc(doc(db, "gifts", id), {
    active: false,
    updatedAt: serverTimestamp(),
  });
}
