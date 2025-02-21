import { inject } from "@adonisjs/core";
import { MultipartFile } from "@adonisjs/core/bodyparser";

import env from "#start/env";

import { FileService } from "./file_service.js";

@inject()
export class PhotoService {
  // eslint-disable-next-line no-useless-constructor
  constructor(private fileService: FileService) {}

  async storePhoto(photo: MultipartFile): Promise<string> {
    const photoStoragePath = env.get(
      "PHOTO_STORAGE_URL",
      "storage/event-photos",
    );

    const photoUrl = await this.fileService.storeFile(photo, photoStoragePath);

    return photoUrl;
  }
}
