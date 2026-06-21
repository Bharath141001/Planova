import { Request, Response, NextFunction } from 'express';
import { validationResult, ValidationChain } from 'express-validator';
import { AnyZodObject, ZodError } from 'zod';
import { sendError } from '../utils/apiResponse';

/** Runs express-validator chains then short-circuits on the first error set. */
export function validate(chains: ValidationChain[]) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    await Promise.all(chains.map((c) => c.run(req)));
    const result = validationResult(req);
    if (!result.isEmpty()) {
      sendError(res, 'Validation failed', 422, 'VALIDATION_ERROR', result.array());
      return;
    }
    next();
  };
}

/** Validates and replaces req.body using a zod schema. */
export function validateBody(schema: AnyZodObject) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        sendError(res, 'Validation failed', 422, 'VALIDATION_ERROR', err.flatten());
        return;
      }
      next(err);
    }
  };
}
