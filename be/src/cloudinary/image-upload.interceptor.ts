// image-upload.interceptor.ts
import { FileInterceptor } from '@nestjs/platform-express';

export const ImageUploadInterceptor = () =>
  FileInterceptor('file', {
    limits: {
      fileSize: 2 * 1024 * 1024,
    },
    fileFilter: (req, file, cb) => {
      if (!file.mimetype.match(/\/(jpg|jpeg|png|webp)$/)) {
        return cb(new Error('Only image files allowed'), false);
      }
      cb(null, true);
    },
  });