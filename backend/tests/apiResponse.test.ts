import { AppError } from '../src/utils/apiResponse';

describe('AppError', () => {
  it('constructs with defaults', () => {
    const err = new AppError('Something went wrong');
    expect(err.status).toBe(400);
    expect(err.code).toBe('BAD_REQUEST');
    expect(err.message).toBe('Something went wrong');
    expect(err.name).toBe('AppError');
  });

  it('constructs with custom status and code', () => {
    const err = new AppError('Forbidden', 403, 'FORBIDDEN');
    expect(err.status).toBe(403);
    expect(err.code).toBe('FORBIDDEN');
  });

  it('.notFound() returns 404 NOT_FOUND', () => {
    const err = AppError.notFound('Issue');
    expect(err.status).toBe(404);
    expect(err.code).toBe('NOT_FOUND');
    expect(err.message).toBe('Issue not found');
  });

  it('.unauthorized() returns 401 UNAUTHORIZED', () => {
    const err = AppError.unauthorized();
    expect(err.status).toBe(401);
    expect(err.code).toBe('UNAUTHORIZED');
  });

  it('.forbidden() returns 403 FORBIDDEN', () => {
    const err = AppError.forbidden();
    expect(err.status).toBe(403);
    expect(err.code).toBe('FORBIDDEN');
  });

  it('.conflict() returns 409 CONFLICT', () => {
    const err = AppError.conflict('Duplicate key');
    expect(err.status).toBe(409);
    expect(err.code).toBe('CONFLICT');
    expect(err.message).toBe('Duplicate key');
  });

  it('is an instance of Error', () => {
    expect(new AppError('x')).toBeInstanceOf(Error);
  });
});
