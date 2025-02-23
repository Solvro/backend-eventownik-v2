import ExcelJS from "exceljs";

import type { HttpContext } from "@adonisjs/core/http";

import Event from "#models/event";
import Participant from "#models/participant";

interface ParticipantData {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
}

export default class EventImportController {
  /**
   * @handle
   * @summary Import participants
   * @operationId importEventSpreadsheet
   * @description Takes given spreadsheet and updates event with :eventId with provided values
   * @paramPath eventId - ID of the event to be imported - @type(number) @required
   * @requestFormDataBody {"spreadsheet":{"type":"file:xlsx","format":"binary"}}
   * @responseBody 200 - {"eventId":"<number>","importedParticipants":"<Participant[]>"}
   * @responseBody 400 - {"errors":[{ "message": "Bad file provided" }]}
   * @responseBody 404 - { message: "Row not found", "name": "Exception", status: 404},
   * @responseBody 500 - {"errors":[{ "message": "Could not process file" }]}
   */
  public async handle({ params, request, response }: HttpContext) {
    await Event.findOrFail(params.eventId);

    const spreadsheetFile = request.file("spreadsheet");

    if (spreadsheetFile?.tmpPath === undefined) {
      return response.internalServerError({
        errors: [{ message: "Could not process file" }],
      });
    }

    const workbook = new ExcelJS.Workbook();

    await workbook.xlsx.readFile(spreadsheetFile.tmpPath);

    const sheet = workbook.getWorksheet(1);

    if (sheet === undefined) {
      return response.badRequest({
        errors: [{ message: "Bad file provided" }],
      });
    }

    const id = sheet.getColumn("A");

    const participantsData: ParticipantData[] = [];

    id.eachCell((cell, rowNumber) => {
      if (cell.value !== null && cell.value !== undefined) {
        const participantId = +cell.value;
        const firstName = sheet.getCell(`B${rowNumber}`).toString();
        const lastName = sheet.getCell(`C${rowNumber}`).toString();
        const email = sheet.getCell(`D${rowNumber}`).toString();

        participantsData.push({
          id: participantId,
          firstName,
          lastName,
          email,
        });
      }
    });

    const importedParticipants = [];

    for (const data of participantsData) {
      const participant = await Participant.updateOrCreate(
        { id: data.id },
        {
          eventId: +params.eventId,
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
        },
      );

      importedParticipants.push(participant);
    }

    return {
      eventId: +params.eventId,
      importedParticipants,
    };
  }
}
