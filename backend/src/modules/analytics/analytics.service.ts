import { prisma } from '../../lib/prisma';
import { cache } from '../../lib/cache';
import { logger } from '../../lib/logger';
import { aiIntegrationService } from './ai-integration.service';

/**
 * ForMyMind Wellbeing Score Algorithm v2
 *
 * Composite score (0-100) based on 5 weighted dimensions:
 *   Mood Average (30%), Mood Stability (15%), Journal Engagement (20%),
 *   Exercise Activity (20%), Overall Consistency (15%)
 */

export class AnalyticsService {
  async getUserPatterns(userId: string) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const cacheKey = `patterns:${userId}`;
    const cached = await cache.get(cacheKey);
    if (cached) return cached;

    const [moods, journals, exercises] = await Promise.all([
      prisma.mood.findMany({
        where: { userId, isDeleted: false, createdAt: { gte: thirtyDaysAgo } },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.journalEntry.findMany({
        where: { userId, isDeleted: false, createdAt: { gte: thirtyDaysAgo } },
        select: { createdAt: true, tags: true, sentiment: true },
      }),
      prisma.userExercise.findMany({
        where: { userId, completedAt: { gte: thirtyDaysAgo } },
        include: { exercise: { select: { category: true } } },
      }),
    ]);

    const moodByDay = moods.reduce(
      (acc, m) => {
        const day = m.createdAt.toISOString().split('T')[0];
        if (!acc[day]) acc[day] = [];
        acc[day].push(m.score);
        return acc;
      },
      {} as Record<string, number[]>,
    );

    const dailyAverages = Object.entries(moodByDay)
      .map(([date, scores]) => ({
        date,
        averageScore: round2(scores.reduce((a, b) => a + b, 0) / scores.length),
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const frequentTags = journals
      .flatMap((j) => j.tags)
      .reduce((acc, tag) => { acc[tag] = (acc[tag] || 0) + 1; return acc; }, {} as Record<string, number>);

    const sentimentAvg = journals.filter((j) => j.sentiment !== null).length > 0
      ? journals.reduce((s, j) => s + (j.sentiment ?? 0), 0) /
        journals.filter((j) => j.sentiment !== null).length
      : null;

    const exerciseFrequency = exercises.reduce(
      (acc, e) => { acc[e.exercise.category] = (acc[e.exercise.category] || 0) + 1; return acc; },
      {} as Record<string, number>,
    );

    const moodTrend = this.calculateTrend(dailyAverages.map((d) => d.averageScore));

    const result = {
      period: { start: thirtyDaysAgo.toISOString(), end: new Date().toISOString() },
      mood: { dailyAverages, totalEntries: moods.length, trend: moodTrend },
      journal: { totalEntries: journals.length, frequentTags, averageSentiment: sentimentAvg ? round2(sentimentAvg) : null },
      exercises: { totalCompleted: exercises.length, byCategory: exerciseFrequency },
    };

    await cache.set(cacheKey, result, 300);
    return result;
  }

  async getWellbeingScore(userId: string) {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const cacheKey = `wellbeing:${userId}`;
    const cached = await cache.get(cacheKey);
    if (cached) return cached;

    const [moods, journalCount, exerciseCount, journalDates, exerciseDates] = await Promise.all([
      prisma.mood.findMany({
        where: { userId, isDeleted: false, createdAt: { gte: sevenDaysAgo } },
        select: { score: true, createdAt: true },
      }),
      prisma.journalEntry.count({ where: { userId, isDeleted: false, createdAt: { gte: sevenDaysAgo } } }),
      prisma.userExercise.count({ where: { userId, completedAt: { gte: sevenDaysAgo } } }),
      prisma.journalEntry.findMany({
        where: { userId, isDeleted: false, createdAt: { gte: sevenDaysAgo } },
        select: { createdAt: true },
      }),
      prisma.userExercise.findMany({
        where: { userId, completedAt: { gte: sevenDaysAgo } },
        select: { completedAt: true },
      }),
    ]);

    const moodAvgRaw = moods.length > 0 ? moods.reduce((sum, m) => sum + m.score, 0) / moods.length : 0;
    const moodScore = (moodAvgRaw / 10) * 30;

    let stabilityScore = 0;
    if (moods.length >= 2) {
      const variance = moods.reduce((sum, m) => sum + Math.pow(m.score - moodAvgRaw, 2), 0) / moods.length;
      stabilityScore = Math.max(0, (1 - Math.sqrt(variance) / 5)) * 15;
    }

    const journalScore = Math.min(journalCount, 7) * (20 / 7);
    const exerciseActivityScore = Math.min(exerciseCount, 7) * (20 / 7);

    const activeDays = new Set([
      ...moods.map((m) => m.createdAt.toISOString().split('T')[0]),
      ...journalDates.map((j) => j.createdAt.toISOString().split('T')[0]),
      ...exerciseDates.map((e) => e.completedAt.toISOString().split('T')[0]),
    ]);
    const consistencyScore = (activeDays.size / 7) * 15;

    const total = Math.min(100, Math.round(moodScore + stabilityScore + journalScore + exerciseActivityScore + consistencyScore));

    const result = {
      score: total,
      level: this.getScoreLevel(total),
      breakdown: {
        moodAverage: { score: round2(moodScore), weight: '30%', raw: round2(moodAvgRaw) },
        moodStability: { score: round2(stabilityScore), weight: '15%' },
        journalEngagement: { score: round2(journalScore), weight: '20%', entries: journalCount },
        exerciseActivity: { score: round2(exerciseActivityScore), weight: '20%', sessions: exerciseCount },
        consistency: { score: round2(consistencyScore), weight: '15%', activeDays: activeDays.size },
      },
      period: { start: sevenDaysAgo.toISOString(), end: new Date().toISOString() },
    };

    await cache.set(cacheKey, result, 600);
    logger.debug({ userId, score: total }, 'Wellbeing score computed');
    return result;
  }

  async getAIPrediction(userId: string) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const cacheKey = `ai-prediction:${userId}`;
    const cached = await cache.get(cacheKey);
    if (cached) return cached;

    const [moods, journals, exercises] = await Promise.all([
      prisma.mood.findMany({
        where: { userId, isDeleted: false, createdAt: { gte: thirtyDaysAgo } },
        orderBy: { createdAt: 'asc' },
        select: { score: true, level: true, createdAt: true },
      }),
      prisma.journalEntry.findMany({
        where: { userId, isDeleted: false, createdAt: { gte: thirtyDaysAgo } },
        select: { content: true },
        take: 10,
      }),
      prisma.userExercise.findMany({
        where: { userId, completedAt: { gte: thirtyDaysAgo } },
        select: { completedAt: true, durationMin: true, exercise: { select: { category: true } } },
      }),
    ]);

    const prediction = await aiIntegrationService.predictWellbeing(
      moods.map((m) => ({ score: m.score, level: m.level, date: m.createdAt.toISOString().split('T')[0] })),
      journals.map((j) => j.content),
      exercises.map((e) => ({
        category: e.exercise.category,
        date: e.completedAt.toISOString().split('T')[0],
        duration_min: e.durationMin ?? undefined,
      })),
    );

    if (!prediction) {
      const fallback = await this.getWellbeingScore(userId);
      return {
        source: 'backend',
        ...fallback,
        ai_available: false,
      };
    }

    const result = { source: 'ai-microservice', ...prediction, ai_available: true };
    await cache.set(cacheKey, result, 600);
    return result;
  }

  private getScoreLevel(score: number): string {
    if (score >= 80) return 'excellent';
    if (score >= 60) return 'good';
    if (score >= 40) return 'moderate';
    if (score >= 20) return 'low';
    return 'critical';
  }

  private calculateTrend(values: number[]): 'improving' | 'declining' | 'stable' {
    if (values.length < 3) return 'stable';
    const n = values.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
    for (let i = 0; i < n; i++) {
      sumX += i; sumY += values[i]; sumXY += i * values[i]; sumX2 += i * i;
    }
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    if (slope > 0.05) return 'improving';
    if (slope < -0.05) return 'declining';
    return 'stable';
  }
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
