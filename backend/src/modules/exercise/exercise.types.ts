import { z } from 'zod';

export const createExerciseSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1),
  category: z.enum([
    'BREATHING',
    'MEDITATION',
    'JOURNALING',
    'PHYSICAL',
    'MINDFULNESS',
    'CBT',
    'RELAXATION',
  ]),
  difficulty: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']),
  durationMin: z.number().int().min(1).max(120),
  instructions: z.array(z.string()).optional().default([]),
  imageUrl: z.string().url().optional(),
});

export const updateExerciseSchema = createExerciseSchema.partial();

export const logExerciseSchema = z.object({
  exerciseId: z.string().uuid(),
  durationMin: z.number().int().min(1).optional(),
  rating: z.number().int().min(1).max(5).optional(),
  notes: z.string().max(500).optional(),
});

export type CreateExerciseInput = z.infer<typeof createExerciseSchema>;
export type UpdateExerciseInput = z.infer<typeof updateExerciseSchema>;
export type LogExerciseInput = z.infer<typeof logExerciseSchema>;
