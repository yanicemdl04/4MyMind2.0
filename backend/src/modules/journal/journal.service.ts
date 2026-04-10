import { prisma } from '../../lib/prisma';
import { ApiError } from '../../utils/api-error';
import { parsePagination, buildPaginatedResponse } from '../../utils/pagination';
import { CreateJournalInput, UpdateJournalInput } from './journal.types';

export class JournalService {
  async create(userId: string, input: CreateJournalInput) {
    return prisma.journalEntry.create({ data: { userId, ...input } });
  }

  async findAll(userId: string, query: Record<string, unknown>) {
    const { page, limit } = parsePagination(query);
    const skip = (page - 1) * limit;
    const where = { userId, isDeleted: false };

    const [entries, total] = await Promise.all([
      prisma.journalEntry.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take: limit }),
      prisma.journalEntry.count({ where }),
    ]);

    return buildPaginatedResponse(entries, total, page, limit);
  }

  async findById(userId: string, id: string) {
    const entry = await prisma.journalEntry.findFirst({ where: { id, userId, isDeleted: false } });
    if (!entry) throw ApiError.notFound('Journal entry not found');
    return entry;
  }

  async update(userId: string, id: string, input: UpdateJournalInput) {
    await this.findById(userId, id);
    return prisma.journalEntry.update({ where: { id }, data: input });
  }

  async delete(userId: string, id: string) {
    await this.findById(userId, id);
    await prisma.journalEntry.update({ where: { id }, data: { isDeleted: true } });
  }
}
