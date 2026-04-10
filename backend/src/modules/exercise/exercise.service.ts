import { prisma } from '../../lib/prisma';
import { ApiError } from '../../utils/api-error';
import { parsePagination, buildPaginatedResponse } from '../../utils/pagination';
import { CreateExerciseInput, UpdateExerciseInput, LogExerciseInput } from './exercise.types';

export class ExerciseService {
  async create(input: CreateExerciseInput) {
    return prisma.exercise.create({ data: input });
  }

  async findAll(query: Record<string, unknown>) {
    const { page, limit } = parsePagination(query);
    const skip = (page - 1) * limit;

    const category = query.category as string | undefined;
    const difficulty = query.difficulty as string | undefined;

    const where = {
      isActive: true,
      ...(category && { category: category as never }),
      ...(difficulty && { difficulty: difficulty as never }),
    };

    const [exercises, total] = await Promise.all([
      prisma.exercise.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.exercise.count({ where }),
    ]);

    return buildPaginatedResponse(exercises, total, page, limit);
  }

  async findById(id: string) {
    const exercise = await prisma.exercise.findUnique({ where: { id } });
    if (!exercise) {
      throw ApiError.notFound('Exercise not found');
    }
    return exercise;
  }

  async update(id: string, input: UpdateExerciseInput) {
    await this.findById(id);
    return prisma.exercise.update({ where: { id }, data: input });
  }

  async delete(id: string) {
    await this.findById(id);
    await prisma.exercise.update({ where: { id }, data: { isActive: false } });
  }

  async logCompletion(userId: string, input: LogExerciseInput) {
    await this.findById(input.exerciseId);

    return prisma.userExercise.create({
      data: {
        userId,
        exerciseId: input.exerciseId,
        durationMin: input.durationMin,
        rating: input.rating,
        notes: input.notes,
      },
      include: { exercise: true },
    });
  }

  async getStats(userId: string) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [totalCompleted, recentCompleted, byCategory] = await Promise.all([
      prisma.userExercise.count({ where: { userId } }),
      prisma.userExercise.count({
        where: { userId, completedAt: { gte: thirtyDaysAgo } },
      }),
      prisma.userExercise.findMany({
        where: { userId },
        include: { exercise: { select: { category: true } } },
      }),
    ]);

    const categoryStats = byCategory.reduce(
      (acc, ue) => {
        const cat = ue.exercise.category;
        acc[cat] = (acc[cat] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    return {
      totalCompleted,
      last30Days: recentCompleted,
      byCategory: categoryStats,
    };
  }

  async getRecommendations(userId: string) {
    const completed = await prisma.userExercise.findMany({
      where: { userId },
      select: { exerciseId: true },
    });

    const completedIds = completed.map((c) => c.exerciseId);

    return prisma.exercise.findMany({
      where: {
        isActive: true,
        id: { notIn: completedIds },
      },
      take: 5,
      orderBy: { createdAt: 'desc' },
    });
  }
}
