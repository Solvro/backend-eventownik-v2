import { randomUUID } from "node:crypto";

import { MultipartFile } from "@adonisjs/core/bodyparser";
import app from "@adonisjs/core/services/app";

export class FileService {
  async storeFile(file: MultipartFile, fileStoragePath: string) {
    await file.move(app.makePath(fileStoragePath), {
      name: `${randomUUID()}.${file.extname}`,
    });

    const fileUrl = `${fileStoragePath}${file.fileName}`;

    return fileUrl;
  }
}
