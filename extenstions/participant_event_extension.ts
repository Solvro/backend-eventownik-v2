import Event from "#models/event";
import Participant from "#models/participant";

declare module "@adonisjs/core/http" {
  export interface HttpContext {
    event: Event;
    participant: Participant;
  }
}
