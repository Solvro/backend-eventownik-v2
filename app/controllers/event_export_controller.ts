import ExcelJS from "exceljs";
import { existsSync, mkdirSync } from "node:fs";
import path from "node:path";

import type { HttpContext } from "@adonisjs/core/http";
import app from "@adonisjs/core/services/app";

import Event from "#models/event";
import env from "#start/env";

export default class EventExportController {
  /**
   * @handle
   * @summary Export participants
   * @operationId exportEventSpreadsheet
   * @description Returns file to download of spreadsheet with all participants of given :eventId
   * @paramPath eventId - ID of the event to be exported - @type(number) @required
   * @responseBody 200 - file:xlsx - Spreadsheet download with xlsx extension
   * @responseBody 404 - { message: "Row not found", "name": "Exception", status: 404},
   */
  public async handle({ params, response }: HttpContext) {
    const event = await Event.query()
      .where("id", +params.eventId)
      .preload("participants")
      .firstOrFail();

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Export");

    for (const participant of event.participants) {
      sheet.addRow([participant.id, participant.email]);
    }

    const tempFolderPath = app.makePath(
      env.get("TEMP_STORAGE_URL", "storage/temp"),
    );

    if (!existsSync(tempFolderPath)) {
      mkdirSync(tempFolderPath, { recursive: true });
    }

    const tempWorksheetFilePath = path.join(tempFolderPath, "worksheet.xlsx");

    await workbook.xlsx.writeFile(tempWorksheetFilePath);

    response.download(tempWorksheetFilePath);
  }
}
