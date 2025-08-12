import { z } from "zod";

// Enum for ticket types matching the smart contract
export enum TicketType {
  REGULAR = 0,
  VIP = 1,
  VVIP = 2
}

// Event schema
export const eventSchema = z.object({
  eventId: z.number(),
  name: z.string(),
  description: z.string(),
  venue: z.string(),
  eventDate: z.number(), // timestamp
  prices: z.array(z.number()).length(3), // [regular, vip, vvip]
  supply: z.array(z.number()).length(3),
  sold: z.array(z.number()).length(3),
  isActive: z.boolean(),
  creator: z.string()
});

// Ticket schema
export const ticketSchema = z.object({
  ticketId: z.number(),
  eventId: z.number(),
  owner: z.string(),
  ticketType: z.nativeEnum(TicketType),
  purchasePrice: z.number(),
  purchaseTime: z.number(),
  isUsed: z.boolean(),
  seat: z.string().optional()
});

// Form schemas for creating events
export const createEventSchema = z.object({
  name: z.string().min(1, "Event name is required"),
  description: z.string().min(1, "Description is required"),
  venue: z.string().min(1, "Venue is required"),
  eventDate: z.string().min(1, "Event date is required"),
  regularPrice: z.number().min(0, "Price must be positive"),
  vipPrice: z.number().min(0, "Price must be positive"),
  vvipPrice: z.number().min(0, "Price must be positive"),
  regularSupply: z.number().min(0, "Supply must be positive"),
  vipSupply: z.number().min(0, "Supply must be positive"),
  vvipSupply: z.number().min(0, "Supply must be positive")
});

export type Event = z.infer<typeof eventSchema>;
export type Ticket = z.infer<typeof ticketSchema>;
export type CreateEventInput = z.infer<typeof createEventSchema>;
