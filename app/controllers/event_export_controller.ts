import ExcelJS from "exceljs";
import { existsSync, mkdirSync } from "node:fs";
import path from "node:path";

import { inject } from "@adonisjs/core";
import type { HttpContext } from "@adonisjs/core/http";
import app from "@adonisjs/core/services/app";

import Event from "#models/event";
import Participant from "#models/participant";
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
      .preload("participants", async (participants) => {
        await participants.preload("attributes");
      })
      .firstOrFail();

    const attributes = await this.attributeService.getEventAttributes(event.id);

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Export");

    const attributesColumns = attributes.map((attribute) => {
      return { header: attribute.name, key: attribute.name };
    });

    sheet.columns = [
      { header: "id", key: "participants_id" },
      { header: "email", key: "participants_email" },
      ...attributesColumns,
    ];

    const sortedParticipants = event.participants
      .map((participant) => {
        return { id: participant.id, email: participant.email };
      })
      .sort((p1, p2) => p1.id - p2.id);

    sheet.getColumn("participants_id").values = ["ID"].concat(
      sortedParticipants.map((participant) => participant.id.toString()),
    );
    sheet.getColumn("participants_email").values = ["Email"].concat(
      sortedParticipants.map((participant) => participant.email),
    );

    const participantsAttributes = await Promise.all(
      sortedParticipants.map(async (participant) => {
        const participantAttributes = await Participant.query()
          .where("id", participant.id)
          .preload("attributes")
          .firstOrFail();

        return participantAttributes;
      }),
    );

    for (const attribute of attributesColumns) {
      const attributeValues: string[] = [];

      attributeValues.push(attribute.header);

      for (const participantWithAttributes of participantsAttributes) {
        const foundAttribute = participantWithAttributes.attributes.find(
          (participantAttribute) => participantAttribute.name === attribute.key,
        );

        if (foundAttribute !== undefined) {
          attributeValues.push(foundAttribute.$extras.pivot_value as string);
        } else {
          attributeValues.push("undefined");
        }
      }

      sheet.getColumn(attribute.key).values = attributeValues;
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
