import { randomUUID } from "node:crypto";
import { existsSync } from "node:fs";
import * as path from "node:path";

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

  async getFileAbsolutePath(
    fileName: string,
    fileStoragePath?: string,
  ): Promise<string | undefined> {
    const storageFolderPath =
      fileStoragePath ?? env.get("FILE_STORAGE_URL", "uploads");

    const filePath = app.makePath(
      path.join(storageFolderPath, fileName).normalize(),
    );

    if (existsSync(filePath)) {
      return filePath;
    }
  }
}
