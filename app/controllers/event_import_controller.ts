import ExcelJS from "exceljs";
import { DateTime } from "luxon";

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
   * @responseBody 404 - {"errors":[{ "message": "Event not found" }]}
   * @responseBody 500 - {"errors":[{ "message": "Could not process file" }]}
   */
  public async handle({ params, request, response }: HttpContext) {
    try {
      await Event.findOrFail(params.eventId);
    } catch (error) {
      response.status(404).send({ errors: [{ message: "Event not found" }] });
      return;
    }

    const spreadsheetFile = request.file("spreadsheet");

    if (spreadsheetFile === null || spreadsheetFile.tmpPath === undefined) {
      response
        .status(500)
        .send({ errors: [{ message: "Could not process file" }] });
      return;
    }

    const workbook = new ExcelJS.Workbook();

    await workbook.xlsx.readFile(spreadsheetFile.tmpPath);

    const sheet = workbook.getWorksheet(1);

    if (sheet === undefined) {
      response.status(400).send({ errors: [{ message: "Bad file provided" }] });
      return;
    }

    const id = sheet.getColumn("A");

    const participantsData: ParticipantData[] = [];

    id.eachCell((cell, rowNumber) => {
      const id = Number(cell.value);
      const firstName = sheet.getCell(`B${rowNumber}`).toString();
      const lastName = sheet.getCell(`C${rowNumber}`).toString();
      const email = sheet.getCell(`D${rowNumber}`).toString();

      participantsData.push({
        id: id,
        firstName: firstName,
        lastName: lastName,
        email: email,
      });
    });

    const importedParticipants = [];

    for await (const data of participantsData) {
      const participant = await Participant.updateOrCreate(
        { id: data.id },
        {
          eventId: params.eventId,
          id: data.id,
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          updatedAt: DateTime.now(),
        },
      );

      importedParticipants.push(participant);
    }

    return {
      eventId: params.eventId,
      importedParticipants: importedParticipants,
    };
  }
}
