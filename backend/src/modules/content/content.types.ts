import { z } from 'zod';

export const contentQuerySchema = z.object({
  type: z.enum(['VIDEO', 'ARTICLE', 'EXERCISE', 'PODCAST', 'INFOGRAPHIC']).optional(),
  page: z.coerce.number().optional(),
  limit: z.coerce.number().optional(),
});

export type ContentQuery = z.infer<typeof contentQuerySchema>;
