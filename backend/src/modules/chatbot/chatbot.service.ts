import { randomUUID } from 'crypto';
import { prisma } from '../../lib/prisma';
import { aiService, ChatCompletionMessage } from '../../lib/ai.service';
import { logger } from '../../lib/logger';
import { SendMessageInput, AnalyzeInput } from './chatbot.types';

export class ChatbotService {
  async sendMessage(userId: string, input: SendMessageInput) {
    const conversationId = input.conversationId || randomUUID();

    await prisma.chatMessage.create({
      data: { userId, conversationId, role: 'USER', content: input.message },
    });

    const history = await prisma.chatMessage.findMany({
      where: { userId, conversationId },
      orderBy: { createdAt: 'asc' },
      take: 20,
    });

    const messages: ChatCompletionMessage[] = history.map((m) => ({
      role: m.role.toLowerCase() as 'user' | 'assistant',
      content: m.content,
    }));

    const context = await this.getUserContext(userId);

    const assistantMessage = await aiService.chatCompletion(messages, context);

    const saved = await prisma.chatMessage.create({
      data: { userId, conversationId, role: 'ASSISTANT', content: assistantMessage },
    });

    logger.debug({ userId, conversationId }, 'Chat message processed');

    return { conversationId, message: saved };
  }

  async getHistory(userId: string, conversationId?: string) {
    const where = conversationId ? { userId, conversationId } : { userId };
    return prisma.chatMessage.findMany({ where, orderBy: { createdAt: 'asc' } });
  }

  async clearHistory(userId: string) {
    const { count } = await prisma.chatMessage.deleteMany({ where: { userId } });
    logger.info({ userId, deletedCount: count }, 'Chat history cleared');
  }

  async analyze(userId: string, input: AnalyzeInput) {
    const microserviceResult = await aiService.analyzeWithMicroservice(input.text);
    if (microserviceResult) return microserviceResult;

    return aiService.analyzeText(input.text);
  }

  async getRecommendations(userId: string) {
    const recentMoods = await prisma.mood.findMany({
      where: { userId, isDeleted: false },
      orderBy: { createdAt: 'desc' },
      take: 7,
    });

    const avgScore = recentMoods.length > 0
      ? recentMoods.reduce((sum, m) => sum + m.score, 0) / recentMoods.length
      : 5;

    const recommendations = await prisma.recommendation.findMany({
      where: { userId, viewed: false },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    return { basedOnMoodScore: Math.round(avgScore * 100) / 100, recommendations };
  }

  private async getUserContext(userId: string) {
    try {
      const [recentMoods, recentJournals] = await Promise.all([
        prisma.mood.findMany({
          where: { userId, isDeleted: false },
          orderBy: { createdAt: 'desc' },
          take: 5,
          select: { score: true },
        }),
        prisma.journalEntry.findMany({
          where: { userId, isDeleted: false },
          orderBy: { createdAt: 'desc' },
          take: 3,
          select: { tags: true },
        }),
      ]);

      const moodAverage = recentMoods.length > 0
        ? recentMoods.reduce((s, m) => s + m.score, 0) / recentMoods.length
        : 5;

      const journalThemes = [...new Set(recentJournals.flatMap((j) => j.tags))];

      return { moodAverage, journalThemes };
    } catch {
      return undefined;
    }
  }
}
