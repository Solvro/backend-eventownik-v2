import type { HttpContext } from "@adonisjs/core/http";

// import Event from "#models/event";

export default class EventImportController {
  /**
   * @handle
   * @summary Import participants
   * @operationId importEventSpreadsheet
   * @description Takes given spreadsheet and updates event with :eventId with provided values
   * @paramPath eventId - ID of the event to be imported - @type(number) @required
   * @requestFormDataBody {"spreadsheet":{"type":"file:xlsx","format":"binary"}}
   * @responseBody 200 - {"eventId":"<number>","importedParticipants":"<Participant[]>","modifiedParticipants":"<Participant[]>"}
   * @responseBody 400 - {"errors":[{ "message": "Bad file provided" }]}
   * @responseBody 404 - {"errors":[{ "message": "Event not found" }]}
   */
  public async handle({ params, request }: HttpContext) {
    //TODO

    console.log(params.eventId);

    const spreadsheet = request.file("spreadsheet");

    console.log(spreadsheet);

    return params.eventId;
  }
}
