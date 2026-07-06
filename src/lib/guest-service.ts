"use client";

import {
  Timestamp,
  addDoc,
  collection,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { EVENT_ID, eventInfo } from "@/lib/event";
import { getFirebaseClients, isFirebaseConfigured } from "@/lib/firebase";
import { createInviteCode } from "@/lib/invite-code";
import type { DashboardStats, Guest, RsvpPayload } from "@/lib/types";
import { guestSchema, rsvpSchema, type GuestInput } from "@/lib/validation";

function mapGuest(id: string, data: Record<string, unknown>): Guest {
  return {
    id,
    eventId: String(data.eventId ?? EVENT_ID),
    mainGuestName: String(data.mainGuestName ?? ""),
    phone: String(data.phone ?? ""),
    inviteCode: String(data.inviteCode ?? ""),
    maxCompanions: Number(data.maxCompanions ?? 0),
    companionNames: Array.isArray(data.companionNames)
      ? data.companionNames.map(String)
      : [],
    status: (data.status as Guest["status"]) ?? "pending",
    active: Boolean(data.active ?? true),
    confirmedAt:
      data.confirmedAt instanceof Timestamp
        ? data.confirmedAt.toDate().toISOString()
        : null,
    createdAt:
      data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : null,
    updatedAt:
      data.updatedAt instanceof Timestamp ? data.updatedAt.toDate().toISOString() : null,
    notes: String(data.notes ?? ""),
    origin: String(data.origin ?? ""),
  };
}

export function getDemoGuest(code = "AB12CD"): Guest {
  return {
    id: "demo",
    eventId: EVENT_ID,
    mainGuestName: "Convidado Especial",
    phone: "",
    inviteCode: code,
    maxCompanions: 2,
    companionNames: [],
    status: "pending",
    active: true,
    confirmedAt: null,
    notes: "Registro demonstrativo ate configurar o Firebase.",
    origin: "demo",
  };
}

export async function findGuestByCode(code: string): Promise<Guest | null> {
  if (!isFirebaseConfigured()) return getDemoGuest(code);

  const { db } = getFirebaseClients();
  const guestsQuery = query(
    collection(db, "guests"),
    where("eventId", "==", EVENT_ID),
    where("inviteCode", "==", code.toUpperCase()),
    limit(1),
  );
  const snapshot = await getDocs(guestsQuery);

  if (snapshot.empty) return null;

  const guestDoc = snapshot.docs[0];
  return mapGuest(guestDoc.id, guestDoc.data());
}

export async function submitRsvp(payload: RsvpPayload) {
  const parsed = rsvpSchema.parse(payload);
  const deadline = new Date(eventInfo.rsvpDeadlineIso).getTime();

  if (Date.now() > deadline) {
    throw new Error(
      "O período de confirmação online foi encerrado. Para mais informações, entre em contato com os organizadores da festa.",
    );
  }

  const guest = await findGuestByCode(parsed.inviteCode);

  if (!guest) throw new Error("Não conseguimos localizar este convite.");
  if (!guest.active) throw new Error("Este convite nao esta disponivel.");
  if (parsed.companions.length > guest.maxCompanions) {
    throw new Error(`Seu convite permite ate ${guest.maxCompanions} acompanhantes.`);
  }

  if (!isFirebaseConfigured()) {
    window.localStorage.setItem(
      `rsvp:${parsed.inviteCode}`,
      JSON.stringify({
        ...parsed,
        status: parsed.willAttend ? "confirmed" : "declined",
        confirmedAt: new Date().toISOString(),
      }),
    );
    return {
      status: parsed.willAttend ? "confirmed" : "declined",
      guest: { ...guest, status: parsed.willAttend ? "confirmed" : "declined" },
    };
  }

  const { db } = getFirebaseClients();
  const guestRef = doc(db, "guests", guest.id);

  await runTransaction(db, async (transaction) => {
    const current = await transaction.get(guestRef);
    if (!current.exists()) throw new Error("Não conseguimos localizar este convite.");

    const data = current.data();
    if (!data.active) throw new Error("Este convite nao esta disponivel.");

    transaction.update(guestRef, {
      mainGuestName: parsed.name,
      phone: parsed.phone,
      companionNames: parsed.willAttend ? parsed.companions : [],
      status: parsed.willAttend ? "confirmed" : "declined",
      confirmedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  });

  return {
    status: parsed.willAttend ? "confirmed" : "declined",
    guest: { ...guest, status: parsed.willAttend ? "confirmed" : "declined" },
  };
}

export async function listGuests(): Promise<Guest[]> {
  if (!isFirebaseConfigured()) {
    return listLocalGuests();
  }

  const { db } = getFirebaseClients();
  const guestsQuery = query(
    collection(db, "guests"),
    where("eventId", "==", EVENT_ID),
    orderBy("createdAt", "desc"),
  );
  const snapshot = await getDocs(guestsQuery);
  return snapshot.docs.map((guestDoc) => mapGuest(guestDoc.id, guestDoc.data()));
}

export function listLocalGuests(): Guest[] {
  if (typeof window === "undefined") return [];

  const saved = window.localStorage.getItem("admin:local-guests");
  if (saved) {
    try {
      const guests = JSON.parse(saved) as Guest[];
      const cleanedGuests = guests.filter(
        (guest) =>
          !["Convidado Especial", "Familia Martins", "Lucas Ribeiro"].includes(
            guest.mainGuestName,
          ),
      );
      if (cleanedGuests.length !== guests.length) {
        window.localStorage.setItem("admin:local-guests", JSON.stringify(cleanedGuests));
      }
      return cleanedGuests;
    } catch {
      window.localStorage.removeItem("admin:local-guests");
    }
  }

  window.localStorage.setItem("admin:local-guests", JSON.stringify([]));
  return [];
}

export function createLocalGuest(input: GuestInput) {
  const parsed = guestSchema.parse(input);
  const guests = listLocalGuests();
  const inviteCode = createInviteCode();
  const guest: Guest = {
    id: `local-${Date.now()}`,
    eventId: EVENT_ID,
    mainGuestName: parsed.mainGuestName,
    phone: parsed.phone,
    inviteCode,
    maxCompanions: parsed.maxCompanions,
    companionNames: [],
    status: "pending",
    active: parsed.active,
    confirmedAt: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    notes: parsed.notes ?? "",
    origin: parsed.origin ?? "admin-code",
  };

  window.localStorage.setItem("admin:local-guests", JSON.stringify([guest, ...guests]));
  return inviteCode;
}

export async function listGuestsFromFirebase(): Promise<Guest[]> {
  if (!isFirebaseConfigured()) {
    return [
      { ...getDemoGuest("AB12CD"), status: "confirmed", companionNames: ["Maria"] },
      {
        ...getDemoGuest("K8L2QZ"),
        id: "demo-2",
        mainGuestName: "Familia Martins",
        status: "pending",
        maxCompanions: 4,
      },
      {
        ...getDemoGuest("R9T5AA"),
        id: "demo-3",
        mainGuestName: "Lucas Ribeiro",
        status: "declined",
        maxCompanions: 0,
      },
    ];
  }

  const { db } = getFirebaseClients();
  const guestsQuery = query(
    collection(db, "guests"),
    where("eventId", "==", EVENT_ID),
    orderBy("createdAt", "desc"),
  );
  const snapshot = await getDocs(guestsQuery);
  return snapshot.docs.map((guestDoc) => mapGuest(guestDoc.id, guestDoc.data()));
}

export async function createGuest(input: GuestInput) {
  const parsed = guestSchema.parse(input);

  if (!isFirebaseConfigured()) {
    throw new Error("Configure o Firebase para cadastrar convidados reais.");
  }

  const { db } = getFirebaseClients();
  const inviteCode = createInviteCode();
  await addDoc(collection(db, "guests"), {
    eventId: EVENT_ID,
    mainGuestName: parsed.mainGuestName,
    phone: parsed.phone,
    inviteCode,
    maxCompanions: parsed.maxCompanions,
    companionNames: [],
    status: "pending",
    active: parsed.active,
    notes: parsed.notes ?? "",
    origin: parsed.origin ?? "admin",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return inviteCode;
}

export async function updateGuestStatus(id: string, status: Guest["status"]) {
  if (!isFirebaseConfigured()) {
    throw new Error("Configure o Firebase para alterar convidados reais.");
  }

  const { db } = getFirebaseClients();
  await updateDoc(doc(db, "guests", id), {
    status,
    updatedAt: serverTimestamp(),
  });
}

export function calculateDashboardStats(guests: Guest[]): DashboardStats {
  const confirmedGuests = guests.filter((guest) => guest.status === "confirmed");
  const confirmedCompanions = confirmedGuests.reduce(
    (total, guest) => total + (guest.companionNames?.length ?? 0),
    0,
  );
  const confirmed = confirmedGuests.length;
  const declined = guests.filter((guest) => guest.status === "declined").length;
  const pending = guests.filter((guest) => guest.status === "pending").length;
  const totalInvites = guests.length;

  return {
    totalGuests: guests.length,
    totalInvites,
    pending,
    confirmed,
    declined,
    estimatedPeople: confirmed + confirmedCompanions,
    confirmedCompanions,
    confirmationRate: totalInvites ? Math.round((confirmed / totalInvites) * 100) : 0,
  };
}
