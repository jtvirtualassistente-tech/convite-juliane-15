export type GuestStatus = "pending" | "confirmed" | "declined" | "cancelled";

export type Guest = {
  id: string;
  eventId: string;
  mainGuestName: string;
  phone: string;
  inviteCode: string;
  maxCompanions: number;
  companionNames?: string[];
  status: GuestStatus;
  active: boolean;
  confirmedAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  notes?: string;
  origin?: string;
};

export type RsvpPayload = {
  inviteCode: string;
  name: string;
  phone: string;
  willAttend: boolean;
  companions: string[];
  reviewed: boolean;
};

export type OpenRsvpPayload = {
  name: string;
  phone: string;
  willAttend: boolean;
  people: string[];
  reviewed: boolean;
};

export type OpenRsvpRecord = OpenRsvpPayload & {
  id: string;
  eventId: string;
  status: "confirmed" | "declined";
  totalPeople: number;
  createdAt: string | null;
};

export type DashboardStats = {
  totalGuests: number;
  totalInvites: number;
  pending: number;
  confirmed: number;
  declined: number;
  estimatedPeople: number;
  confirmedCompanions: number;
  confirmationRate: number;
};
