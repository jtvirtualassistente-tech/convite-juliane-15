"use client";

import { defaultContent, eventInfo } from "@/lib/event";

export type AdminGift = {
  id: string;
  name: string;
  category: string;
  description: string;
  imageUrl: string;
  linkUrl: string;
  size: string;
  color: string;
  notes: string;
  priority: string;
  active: boolean;
};

export type AdminContent = {
  heroTitle: string;
  heroSubtitle: string;
  inviteText: string;
  aboutText: string;
  finalText: string;
  dressCode: string;
  parking: string;
  childrenRules: string;
  arrivalTime: string;
  contactPhone: string;
};

const giftsKey = "admin:gifts";
const contentKey = "admin:content";

export function defaultAdminContent(): AdminContent {
  return {
    heroTitle: "Juliane",
    heroSubtitle: "Sob a luz das estrelas, um sonho esta prestes a se tornar realidade.",
    inviteText:
      "Existem momentos que ficam guardados para sempre em nossa memória. E este será um deles. Com muita alegria, convidamos você para celebrar uma noite muito especial.",
    aboutText: defaultContent.about,
    finalText: defaultContent.final,
    dressCode: "",
    parking: "",
    childrenRules: "",
    arrivalTime: eventInfo.timeLabel,
    contactPhone: "",
  };
}

export function listAdminGifts(): AdminGift[] {
  if (typeof window === "undefined") return [];
  const saved = window.localStorage.getItem(giftsKey);
  if (!saved) return [];

  try {
    return JSON.parse(saved) as AdminGift[];
  } catch {
    window.localStorage.removeItem(giftsKey);
    return [];
  }
}

export function saveAdminGift(gift: Omit<AdminGift, "id">) {
  const gifts = listAdminGifts();
  const newGift: AdminGift = {
    ...gift,
    id: `gift-${Date.now()}`,
  };
  window.localStorage.setItem(giftsKey, JSON.stringify([newGift, ...gifts]));
  return newGift;
}

export function deleteAdminGift(id: string) {
  const gifts = listAdminGifts().filter((gift) => gift.id !== id);
  window.localStorage.setItem(giftsKey, JSON.stringify(gifts));
}

export function getAdminContent(): AdminContent {
  if (typeof window === "undefined") return defaultAdminContent();
  const saved = window.localStorage.getItem(contentKey);
  if (!saved) return defaultAdminContent();

  try {
    return { ...defaultAdminContent(), ...(JSON.parse(saved) as Partial<AdminContent>) };
  } catch {
    window.localStorage.removeItem(contentKey);
    return defaultAdminContent();
  }
}

export function saveAdminContent(content: AdminContent) {
  window.localStorage.setItem(contentKey, JSON.stringify(content));
}
