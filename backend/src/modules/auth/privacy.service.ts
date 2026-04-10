import { prisma } from '../../lib/prisma';
import { logger } from '../../lib/logger';

export class PrivacyService {
  /**
   * GDPR Art. 20 — Data Portability: export all user data in JSON format.
   */
  async exportUserData(userId: string) {
    const [user, journals, moods, exercises, chatMessages, recommendations] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, email: true, firstName: true, lastName: true, createdAt: true },
      }),
      prisma.journalEntry.findMany({
        where: { userId, isDeleted: false },
        select: { id: true, title: true, content: true, tags: true, sentiment: true, createdAt: true },
      }),
      prisma.mood.findMany({
        where: { userId, isDeleted: false },
        select: { id: true, level: true, score: true, note: true, factors: true, createdAt: true },
      }),
      prisma.userExercise.findMany({
        where: { userId },
        include: { exercise: { select: { title: true, category: true } } },
      }),
      prisma.chatMessage.findMany({
        where: { userId },
        select: { id: true, role: true, content: true, conversationId: true, createdAt: true },
      }),
      prisma.recommendation.findMany({
        where: { userId },
        select: { id: true, type: true, title: true, reason: true, createdAt: true },
      }),
    ]);

    logger.info({ userId }, 'User data exported (GDPR)');

    return {
      exportedAt: new Date().toISOString(),
      user,
      journals,
      moods,
      exercises,
      chatMessages,
      recommendations,
    };
  }

  /**
   * GDPR Art. 17 — Right to Erasure: permanently delete all user data.
   */
  async deleteAllUserData(userId: string) {
    const counts = await prisma.$transaction(async (tx) => {
      const chat = await tx.chatMessage.deleteMany({ where: { userId } });
      const recs = await tx.recommendation.deleteMany({ where: { userId } });
      const analytics = await tx.analyticsData.deleteMany({ where: { userId } });
      const exercises = await tx.userExercise.deleteMany({ where: { userId } });
      const moods = await tx.mood.deleteMany({ where: { userId } });
      const journals = await tx.journalEntry.deleteMany({ where: { userId } });
      await tx.user.delete({ where: { id: userId } });

      return {
        chatMessages: chat.count,
        recommendations: recs.count,
        analytics: analytics.count,
        exercises: exercises.count,
        moods: moods.count,
        journals: journals.count,
        user: 1,
      };
    });

    logger.warn({ userId, counts }, 'User data permanently deleted (GDPR erasure)');
    return counts;
  }

  /**
   * Anonymize user data — remove PII but keep aggregated data for research.
   */
  async anonymizeUser(userId: string) {
    const anonId = `anon-${Date.now()}`;

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: {
          email: `${anonId}@anonymized.local`,
          firstName: 'Anonymized',
          lastName: 'User',
          password: 'ANONYMIZED',
          avatarUrl: null,
          refreshTokenHash: null,
          isActive: false,
        },
      });

      await tx.journalEntry.updateMany({
        where: { userId },
        data: { title: 'Anonymized', content: 'Content removed for privacy' },
      });

      await tx.mood.updateMany({
        where: { userId },
        data: { note: null },
      });

      await tx.chatMessage.deleteMany({ where: { userId } });
    });

    logger.warn({ userId }, 'User data anonymized');
    return { anonymizedAs: anonId };
  }
}
