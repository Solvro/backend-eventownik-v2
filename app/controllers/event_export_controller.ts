import type { HttpContext } from "@adonisjs/core/http";

// import Event from "#models/event";

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
    //TODO

    console.log(params.eventId);

    response.download("spreadsheet.xlsx");
    //albo
    response.attachment("spreadsheet.xlsx");
  }
}
