import { z } from "zod";

export const phoneSchema = z
  .string()
  .min(10, "Informe um telefone valido.")
  .max(20, "Telefone muito longo.")
  .regex(/^[0-9+\-()\s]+$/, "Use apenas numeros e sinais validos.");

export const rsvpSchema = z.object({
  inviteCode: z.string().min(4),
  name: z.string().trim().min(2, "Informe seu nome."),
  phone: phoneSchema,
  willAttend: z.boolean(),
  companions: z.array(z.string().trim().min(2)).max(200).default([]),
  reviewed: z.literal(true, {
    errorMap: () => ({ message: "Revise os dados antes de enviar." }),
  }),
});

export const openRsvpSchema = z.object({
  name: z.string().trim().min(2, "Informe seu nome."),
  phone: phoneSchema.or(z.literal("")).optional().default(""),
  willAttend: z.boolean(),
  people: z.array(z.string().trim().min(2)).max(300).default([]),
  reviewed: z.literal(true, {
    errorMap: () => ({ message: "Revise os dados antes de enviar." }),
  }),
});

export const guestSchema = z.object({
  mainGuestName: z.string().trim().min(2, "Informe o nome."),
  phone: phoneSchema.or(z.literal("")),
  maxCompanions: z.coerce.number().int().min(0).max(999),
  notes: z.string().max(600).optional(),
  origin: z.string().max(120).optional(),
  active: z.boolean().default(true),
});

export type RsvpInput = z.infer<typeof rsvpSchema>;
export type OpenRsvpInput = z.infer<typeof openRsvpSchema>;
export type GuestInput = z.infer<typeof guestSchema>;
