import { z } from 'zod';
import { bodySites } from '@/lib/body-map-data';

const siteIds = bodySites.map((s) => s.id) as [string, ...string[]];

export const injectionLogSchema = z.object({
  id: z.string().uuid(),
  siteId: z.enum(siteIds),
  compound: z.string().trim().min(1).max(120),
  dose: z.number().positive().finite(),
  unit: z.enum(['mg', 'mcg']),
  timestamp: z.string().datetime(),
  notes: z.string().max(500).optional(),
  updatedAt: z.string().datetime().optional(),
  deletedAt: z.string().datetime().nullable().optional(),
});

export const inventoryItemSchema = z.object({
  id: z.string().uuid(),
  name: z.string().trim().min(1).max(120),
  concentration: z.number().positive().finite(),
  totalVolume: z.number().positive().finite(),
  remainingVolume: z.number().min(0).finite(),
  unit: z.enum(['mg', 'mcg']),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  frequency: z.string().trim().max(40).optional(),
  defaultDose: z.number().positive().finite().optional(),
  reconstitutedAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
  deletedAt: z.string().datetime().nullable().optional(),
});

export const scheduledDoseSchema = z.object({
  id: z.string().uuid(),
  compound: z.string().trim().min(1).max(120),
  dose: z.number().positive().finite(),
  unit: z.enum(['mg', 'mcg']),
  time: z.string().regex(/^\d{2}:\d{2}$/),
  days: z.array(z.number().int().min(0).max(6)),
  active: z.boolean(),
  updatedAt: z.string().datetime().optional(),
  deletedAt: z.string().datetime().nullable().optional(),
});

export const pinsDataSchema = z.object({
  logs: z.array(injectionLogSchema),
  inventory: z.array(inventoryItemSchema),
  schedule: z.array(scheduledDoseSchema),
});

export const newInjectionLogSchema = z.object({
  siteId: z.enum(siteIds),
  compound: z.string().trim().min(1).max(120),
  dose: z.number().positive().finite(),
  unit: z.enum(['mg', 'mcg']),
  timestamp: z.string().datetime(),
  notes: z.string().max(500).optional(),
});

export const newInventoryItemSchema = z.object({
  name: z.string().trim().min(1).max(120),
  concentration: z.number().positive().finite(),
  totalVolume: z.number().positive().finite(),
  remainingVolume: z.number().positive().finite(),
  unit: z.enum(['mg', 'mcg']),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  frequency: z.string().trim().max(40).optional(),
  defaultDose: z.number().positive().finite().optional(),
  reconstitutedAt: z.string().datetime().optional(),
});

export type NewInjectionLog = z.infer<typeof newInjectionLogSchema>;
export type NewInventoryItem = z.infer<typeof newInventoryItemSchema>;

export function formatZodError(error: z.ZodError): string {
  return error.errors.map((e) => e.message).join('. ');
}