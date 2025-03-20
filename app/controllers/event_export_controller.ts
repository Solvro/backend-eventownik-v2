import ExcelJS from "exceljs";
import { existsSync, mkdirSync } from "node:fs";
import path from "node:path";

import { inject } from "@adonisjs/core";
import type { HttpContext } from "@adonisjs/core/http";
import app from "@adonisjs/core/services/app";

import Event from "#models/event";
import { AttributeService } from "#services/attribute_service";
import env from "#start/env";

@inject()
export default class EventExportController {
  // eslint-disable-next-line no-useless-constructor
  constructor(private attributeService: AttributeService) {}

  /**
   * @handle
   * @summary Export participants
   * @operationId exportEventSpreadsheet
   * @description Returns file to download of spreadsheet with all participants of given :eventId
   * @paramPath eventId - ID of the event to be exported - @type(number) @required
   * @responseBody 200 - file:xlsx - Spreadsheet download with xlsx extension
   * @responseBody 404 - { message: "Row not found", "name": "Exception", status: 404 },
   */
  public async handle({ params, response }: HttpContext) {
    const event = await Event.query()
      .where("id", +params.eventId)
      .preload("participants")
      .firstOrFail();

    const attributes = await this.attributeService.getEventAttributes(event.id);

    console.log(`attributes`);
    console.log(attributes);

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Export");

    sheet.columns = [
      { header: "id", key: "participants_id" },
      { header: "email", key: "participants_email" },
      { header: "gap", key: "gap" },
      { header: "attribute id", key: "attribute_id" },
      { header: "attribute type", key: "attribute_type" },
    ];

    sheet.getColumn("participants_id").values = event.participants.map(
      (p) => p.id,
    );
    sheet.getColumn("participants_email").values = event.participants.map(
      (p) => p.email,
    );
    sheet.getColumn("attribute_id").values = attributes.map((p) => p.id);
    sheet.getColumn("attribute_type").values = attributes.map((p) => p.type);

    // for (const participant of event.participants) {
    //   sheet.addRow({id: participant.id, email: participant.email});
    // }

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
