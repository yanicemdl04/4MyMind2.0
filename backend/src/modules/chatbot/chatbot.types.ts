import { z } from 'zod';

export const sendMessageSchema = z.object({
  message: z.string().min(1, 'Message is required').max(2000),
  conversationId: z.string().uuid().optional(),
});

export const analyzeSchema = z.object({
  text: z.string().min(1, 'Text is required').max(5000),
});

export type SendMessageInput = z.infer<typeof sendMessageSchema>;
export type AnalyzeInput = z.infer<typeof analyzeSchema>;
