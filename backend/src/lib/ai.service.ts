import { getOpenAIClient } from './openai';
import { env } from '../config/env';
import { logger } from './logger';
import { CHATBOT_SYSTEM_PROMPT, ANALYSIS_SYSTEM_PROMPT, buildContextualPrompt } from './ai.prompts';

export interface ChatCompletionMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AnalysisResult {
  sentiment: string;
  sentimentScore: number;
  emotions: string[];
  cognitiveDistortions: string[];
  themes: string[];
  suggestions: string[];
}

export class AIService {
  async chatCompletion(
    conversationHistory: ChatCompletionMessage[],
    context?: { moodAverage: number; journalThemes: string[] },
  ): Promise<string> {
    const openai = getOpenAIClient();

    const systemMessages: ChatCompletionMessage[] = [
      { role: 'system', content: CHATBOT_SYSTEM_PROMPT },
    ];

    if (context) {
      const contextPrompt = buildContextualPrompt(context.moodAverage, context.journalThemes);
      if (contextPrompt) {
        systemMessages.push({ role: 'system', content: contextPrompt });
      }
    }

    const messages = [...systemMessages, ...conversationHistory];

    try {
      const completion = await openai.chat.completions.create({
        model: env.OPENAI_MODEL,
        messages,
        max_tokens: 800,
        temperature: 0.7,
        presence_penalty: 0.1,
        frequency_penalty: 0.1,
      });

      return completion.choices[0]?.message?.content ?? 'I apologize, I could not generate a response.';
    } catch (error) {
      logger.error({ error }, 'OpenAI chat completion failed');
      throw new Error('AI service temporarily unavailable');
    }
  }

  async analyzeText(text: string): Promise<AnalysisResult> {
    const openai = getOpenAIClient();

    try {
      const completion = await openai.chat.completions.create({
        model: env.OPENAI_MODEL,
        messages: [
          { role: 'system', content: ANALYSIS_SYSTEM_PROMPT },
          { role: 'user', content: text },
        ],
        max_tokens: 500,
        temperature: 0.2,
        response_format: { type: 'json_object' },
      });

      const raw = completion.choices[0]?.message?.content ?? '{}';
      return JSON.parse(raw) as AnalysisResult;
    } catch (error) {
      logger.error({ error }, 'OpenAI text analysis failed');
      return {
        sentiment: 'unknown',
        sentimentScore: 0,
        emotions: [],
        cognitiveDistortions: [],
        themes: [],
        suggestions: [],
      };
    }
  }

  /**
   * Placeholder for future Python microservice integration.
   * Will call FastAPI endpoint for advanced NLP analysis.
   */
  async analyzeWithMicroservice(_text: string): Promise<AnalysisResult | null> {
    if (!env.AI_SERVICE_URL) return null;

    try {
      const response = await fetch(`${env.AI_SERVICE_URL}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: _text }),
        signal: AbortSignal.timeout(10_000),
      });

      if (!response.ok) return null;
      return (await response.json()) as AnalysisResult;
    } catch (error) {
      logger.warn({ error }, 'AI microservice unavailable, falling back to OpenAI');
      return null;
    }
  }
}

export const aiService = new AIService();
