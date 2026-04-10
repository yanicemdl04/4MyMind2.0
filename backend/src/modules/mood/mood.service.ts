import { prisma } from '../../lib/prisma';
import { ApiError } from '../../utils/api-error';
import { parsePagination, buildPaginatedResponse } from '../../utils/pagination';
import { CreateMoodInput, UpdateMoodInput } from './mood.types';

const RANGE_MAP: Record<string, number> = {
  '7days': 7,
  '30days': 30,
  '90days': 90,
  '1year': 365,
};

export class MoodService {
  async create(userId: string, input: CreateMoodInput) {
    return prisma.mood.create({ data: { userId, ...input } });
  }

  async findAll(userId: string, query: Record<string, unknown>) {
    const { page, limit } = parsePagination(query);
    const skip = (page - 1) * limit;
    const where = { userId, isDeleted: false };

    const [moods, total] = await Promise.all([
      prisma.mood.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take: limit }),
      prisma.mood.count({ where }),
    ]);

    return buildPaginatedResponse(moods, total, page, limit);
  }

  async findById(userId: string, id: string) {
    const mood = await prisma.mood.findFirst({ where: { id, userId, isDeleted: false } });
    if (!mood) throw ApiError.notFound('Mood entry not found');
    return mood;
  }

  async update(userId: string, id: string, input: UpdateMoodInput) {
    await this.findById(userId, id);
    return prisma.mood.update({ where: { id }, data: input });
  }

  async delete(userId: string, id: string) {
    await this.findById(userId, id);
    await prisma.mood.update({ where: { id }, data: { isDeleted: true } });
  }

  async getStats(userId: string, range: string) {
    const days = RANGE_MAP[range] ?? 7;
    const since = new Date();
    since.setDate(since.getDate() - days);

    const moods = await prisma.mood.findMany({
      where: { userId, isDeleted: false, createdAt: { gte: since } },
      orderBy: { createdAt: 'asc' },
    });

    if (moods.length === 0) {
      return {
        average: 0,
        count: 0,
        trend: [],
        trendDirection: 'stable' as const,
        distribution: {},
        anomalies: [],
      };
    }

    const average = moods.reduce((sum, m) => sum + m.score, 0) / moods.length;

    const distribution = moods.reduce(
      (acc, m) => {
        acc[m.level] = (acc[m.level] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    const trend = moods.map((m) => ({
      date: m.createdAt,
      score: m.score,
      level: m.level,
    }));

    const trendDirection = this.calculateTrendDirection(moods.map((m) => m.score));
    const anomalies = this.detectAnomalies(moods);

    return {
      average: Math.round(average * 100) / 100,
      count: moods.length,
      trend,
      trendDirection,
      distribution,
      anomalies,
    };
  }

  /**
   * Linear regression slope to determine if mood is improving, declining, or stable.
   */
  private calculateTrendDirection(scores: number[]): 'improving' | 'declining' | 'stable' {
    if (scores.length < 3) return 'stable';

    const n = scores.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
    for (let i = 0; i < n; i++) {
      sumX += i;
      sumY += scores[i];
      sumXY += i * scores[i];
      sumX2 += i * i;
    }

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);

    if (slope > 0.1) return 'improving';
    if (slope < -0.1) return 'declining';
    return 'stable';
  }

  /**
   * Detect sudden mood drops (score drops >= 3 points from rolling average).
   */
  private detectAnomalies(moods: { score: number; createdAt: Date }[]) {
    const anomalies: { date: Date; score: number; expectedRange: string }[] = [];
    if (moods.length < 4) return anomalies;

    const windowSize = 3;
    for (let i = windowSize; i < moods.length; i++) {
      const windowAvg =
        moods.slice(i - windowSize, i).reduce((s, m) => s + m.score, 0) / windowSize;
      const deviation = moods[i].score - windowAvg;

      if (deviation <= -3) {
        anomalies.push({
          date: moods[i].createdAt,
          score: moods[i].score,
          expectedRange: `${Math.round(windowAvg - 1)}-${Math.round(windowAvg + 1)}`,
        });
      }
    }

    return anomalies;
  }
}
