import { z } from 'zod';

export const createMoodSchema = z.object({
  level: z.enum(['VERY_LOW', 'LOW', 'NEUTRAL', 'GOOD', 'EXCELLENT']),
  score: z.number().int().min(1).max(10),
  note: z.string().max(500).optional(),
  factors: z.array(z.string()).optional().default([]),
});

export const updateMoodSchema = z.object({
  level: z.enum(['VERY_LOW', 'LOW', 'NEUTRAL', 'GOOD', 'EXCELLENT']).optional(),
  score: z.number().int().min(1).max(10).optional(),
  note: z.string().max(500).optional(),
  factors: z.array(z.string()).optional(),
});

export const moodStatsQuerySchema = z.object({
  range: z.enum(['7days', '30days', '90days', '1year']).default('7days'),
});

export type CreateMoodInput = z.infer<typeof createMoodSchema>;
export type UpdateMoodInput = z.infer<typeof updateMoodSchema>;
