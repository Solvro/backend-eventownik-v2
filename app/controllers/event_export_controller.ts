import ExcelJS from "exceljs";

import type { HttpContext } from "@adonisjs/core/http";

import Event from "#models/event";

export default class EventExportController {
  /**
   * @handle
   * @summary Export participants
   * @operationId exportEventSpreadsheet
   * @description Returns file to download of spreadsheet with all participants of given :eventId
   * @paramPath eventId - ID of the event to be exported - @type(number) @required
   * @responseBody 200 - file:xlsx - Spreadsheet download with xlsx extension
   * @responseBody 404 - {"errors":[{ "message": "Event not found" }]}
   */
  public async handle({ params, response }: HttpContext) {
    let event;

    try {
      event = await Event.findOrFail(params.eventId);
    } catch (error) {
      response.status(404).send({ errors: [{ message: "Event not found" }] });
      return;
    }
    await event.load("participants");

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Export");

    for (const participant of event.participants) {
      sheet.addRow([
        participant.id,
        participant.firstName,
        participant.lastName,
        participant.email,
      ]);
    }

    await workbook.xlsx.writeFile("/tmp/spreadsheet.xlsx");

    response.download("/tmp/spreadsheet.xlsx");
  }
}
