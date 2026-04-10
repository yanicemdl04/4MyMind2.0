import { env } from '../../config/env';
import { logger } from '../../lib/logger';

interface MoodEntry {
  score: number;
  level: string;
  date: string;
}

interface ActivityEntry {
  category: string;
  date: string;
  duration_min?: number;
}

interface WellbeingPrediction {
  wellbeing_score: number;
  risk_level: 'low' | 'medium' | 'high';
  trend: 'improving' | 'stable' | 'declining';
  breakdown: {
    mood_component: number;
    stability_component: number;
    sentiment_component: number;
    activity_component: number;
  };
  insights: string[];
}

interface SentimentResult {
  sentiment: 'positive' | 'neutral' | 'negative';
  score: number;
  subjectivity: number;
}

export class AIIntegrationService {
  private readonly baseUrl: string | undefined;
  private readonly timeout = 10_000;

  constructor() {
    this.baseUrl = env.AI_SERVICE_URL;
  }

  get isAvailable(): boolean {
    return !!this.baseUrl;
  }

  async predictWellbeing(
    moods: MoodEntry[],
    journalTexts: string[],
    activities: ActivityEntry[],
  ): Promise<WellbeingPrediction | null> {
    if (!this.baseUrl) {
      logger.debug('AI microservice not configured, skipping wellbeing prediction');
      return null;
    }

    try {
      const response = await fetch(`${this.baseUrl}/predict/wellbeing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          moods,
          journal_texts: journalTexts,
          activities,
        }),
        signal: AbortSignal.timeout(this.timeout),
      });

      if (!response.ok) {
        logger.warn({ status: response.status }, 'AI microservice returned error');
        return null;
      }

      const data = (await response.json()) as WellbeingPrediction;
      logger.debug({ score: data.wellbeing_score }, 'AI wellbeing prediction received');
      return data;
    } catch (error) {
      logger.warn({ error }, 'AI microservice unavailable for wellbeing prediction');
      return null;
    }
  }

  async analyzeSentiment(text: string): Promise<SentimentResult | null> {
    if (!this.baseUrl) return null;

    try {
      const response = await fetch(`${this.baseUrl}/analyze/sentiment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
        signal: AbortSignal.timeout(this.timeout),
      });

      if (!response.ok) return null;

      return (await response.json()) as SentimentResult;
    } catch (error) {
      logger.warn({ error }, 'AI microservice unavailable for sentiment analysis');
      return null;
    }
  }

  async checkHealth(): Promise<boolean> {
    if (!this.baseUrl) return false;

    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        signal: AbortSignal.timeout(3_000),
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}

export const aiIntegrationService = new AIIntegrationService();
