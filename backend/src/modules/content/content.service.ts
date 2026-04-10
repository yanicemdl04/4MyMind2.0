import { ContentType } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { ApiError } from '../../utils/api-error';
import { parsePagination, buildPaginatedResponse } from '../../utils/pagination';

export class ContentService {
  async findAll(query: Record<string, unknown>) {
    const { page, limit } = parsePagination(query);
    const skip = (page - 1) * limit;

    const [contents, total] = await Promise.all([
      prisma.content.findMany({
        where: { isActive: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.content.count({ where: { isActive: true } }),
    ]);

    return buildPaginatedResponse(contents, total, page, limit);
  }

  async findByType(type: string, query: Record<string, unknown>) {
    const { page, limit } = parsePagination(query);
    const skip = (page - 1) * limit;

    const contentType = type.toUpperCase() as ContentType;

    const where = { isActive: true, type: contentType };

    const [contents, total] = await Promise.all([
      prisma.content.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.content.count({ where }),
    ]);

    return buildPaginatedResponse(contents, total, page, limit);
  }

  async findById(id: string) {
    const content = await prisma.content.findUnique({ where: { id } });
    if (!content) {
      throw ApiError.notFound('Content not found');
    }
    return content;
  }

  async getRecommended(userId: string) {
    const recentMoods = await prisma.mood.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    const tags: string[] = [];
    for (const mood of recentMoods) {
      if (mood.score <= 3) {
        tags.push('anxiety', 'stress-relief', 'relaxation');
      } else if (mood.score <= 6) {
        tags.push('mindfulness', 'self-care', 'growth');
      } else {
        tags.push('motivation', 'gratitude', 'positivity');
      }
    }

    const uniqueTags = [...new Set(tags)];

    const contents = await prisma.content.findMany({
      where: {
        isActive: true,
        tags: { hasSome: uniqueTags.length > 0 ? uniqueTags : ['general'] },
      },
      take: 10,
      orderBy: { createdAt: 'desc' },
    });

    return contents;
  }
}
