import { randomUUID } from "node:crypto";

import { MultipartFile } from "@adonisjs/core/bodyparser";
import app from "@adonisjs/core/services/app";

import env from "#start/env";

export class FileService {
  async storeFile(
    file: MultipartFile,
    fileStoragePath?: string,
  ): Promise<string | undefined> {
    const filePath = fileStoragePath ?? env.get("FILE_STORAGE_URL", "uploads");

    await file.move(app.makePath(filePath), {
      name: `${randomUUID()}.${file.extname}`,
    });

    return file.fileName;
  }
}
