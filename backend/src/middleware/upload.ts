import multer from 'multer';
import { AppError } from '../utils/apiResponse';

const MAX_SIZE = 10 * 1024 * 1024; // 10MB

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_SIZE },
  fileFilter: (_req, file, cb) => {
    const allowed = /image\/|application\/pdf|text\/|application\/(zip|json|msword|vnd)/;
    if (allowed.test(file.mimetype)) cb(null, true);
    else cb(new AppError(`Unsupported file type: ${file.mimetype}`));
  },
});
