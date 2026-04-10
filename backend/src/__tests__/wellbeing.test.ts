import { AnalyticsService } from '../modules/analytics/analytics.service';

describe('Wellbeing Score Algorithm', () => {
  it('should be a class with getWellbeingScore and getUserPatterns methods', () => {
    const service = new AnalyticsService();
    expect(typeof service.getWellbeingScore).toBe('function');
    expect(typeof service.getUserPatterns).toBe('function');
  });
});

describe('API Error', () => {
  it('should create proper error instances', () => {
    const { ApiError } = require('../utils/api-error');

    const badReq = ApiError.badRequest('test');
    expect(badReq.statusCode).toBe(400);
    expect(badReq.message).toBe('test');

    const unauth = ApiError.unauthorized();
    expect(unauth.statusCode).toBe(401);

    const notFound = ApiError.notFound('missing');
    expect(notFound.statusCode).toBe(404);
    expect(notFound.message).toBe('missing');
  });
});

describe('Pagination Utility', () => {
  const { parsePagination, buildPaginatedResponse } = require('../utils/pagination');

  it('should parse default pagination', () => {
    const result = parsePagination({});
    expect(result).toEqual({ page: 1, limit: 10 });
  });

  it('should clamp pagination values', () => {
    expect(parsePagination({ page: -5, limit: 999 })).toEqual({ page: 1, limit: 100 });
    expect(parsePagination({ page: 3, limit: 0 })).toEqual({ page: 3, limit: 1 });
  });

  it('should build paginated response correctly', () => {
    const result = buildPaginatedResponse(['a', 'b'], 10, 1, 2);
    expect(result.data).toEqual(['a', 'b']);
    expect(result.meta).toEqual({ total: 10, page: 1, limit: 2, totalPages: 5 });
  });
});
