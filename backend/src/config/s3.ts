import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomBytes } from 'crypto';
import path from 'path';
import fs from 'fs/promises';
import { env } from './env';
import { logger } from './logger';

const LOCAL_UPLOAD_DIR = path.resolve(process.cwd(), 'uploads');

let s3: S3Client | null = null;
if (env.aws.enabled) {
  s3 = new S3Client({
    region: env.aws.region,
    credentials: {
      accessKeyId: env.aws.accessKeyId,
      secretAccessKey: env.aws.secretAccessKey,
    },
  });
}

export interface UploadResult {
  fileUrl: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
}

/**
 * Uploads a buffer to S3 when configured, otherwise falls back to local disk
 * storage under /uploads so the app remains fully functional in development.
 */
export async function uploadFile(
  buffer: Buffer,
  originalName: string,
  mimeType: string
): Promise<UploadResult> {
  const ext = path.extname(originalName);
  const key = `attachments/${randomBytes(16).toString('hex')}${ext}`;

  if (s3 && env.aws.enabled) {
    await s3.send(
      new PutObjectCommand({
        Bucket: env.aws.bucket,
        Key: key,
        Body: buffer,
        ContentType: mimeType,
      })
    );
    const fileUrl = await getSignedUrl(
      s3,
      new PutObjectCommand({ Bucket: env.aws.bucket, Key: key }),
      { expiresIn: 3600 }
    ).catch(() => `https://${env.aws.bucket}.s3.${env.aws.region}.amazonaws.com/${key}`);

    return { fileUrl, fileName: originalName, fileSize: buffer.length, mimeType };
  }

  // Local fallback
  await fs.mkdir(LOCAL_UPLOAD_DIR, { recursive: true });
  const localName = key.replace('attachments/', '');
  await fs.writeFile(path.join(LOCAL_UPLOAD_DIR, localName), buffer);
  logger.debug(`Stored attachment locally: ${localName}`);

  return {
    fileUrl: `/uploads/${localName}`,
    fileName: originalName,
    fileSize: buffer.length,
    mimeType,
  };
}

export async function deleteFile(fileUrl: string): Promise<void> {
  if (s3 && env.aws.enabled && !fileUrl.startsWith('/uploads/')) {
    const key = fileUrl.split(`${env.aws.bucket}.s3.${env.aws.region}.amazonaws.com/`)[1];
    if (key) {
      await s3.send(new DeleteObjectCommand({ Bucket: env.aws.bucket, Key: key }));
    }
    return;
  }
  if (fileUrl.startsWith('/uploads/')) {
    const localPath = path.join(LOCAL_UPLOAD_DIR, fileUrl.replace('/uploads/', ''));
    await fs.unlink(localPath).catch(() => undefined);
  }
}

export const localUploadDir = LOCAL_UPLOAD_DIR;
