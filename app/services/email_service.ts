import Email from "#models/email";
import Event from "#models/event";
import Participant from "#models/participant";

import { EmailTriggerType } from "../types/trigger_types.js";

export class EmailService {
  static async sendOnTrigger(
    event: Event,
    participant: Participant,
    trigger: EmailTriggerType,
    triggerValue?: string | number,
    triggerValue2?: string,
  ) {
    const email = await Email.query()
      .where("event_id", event.id)
      .where("trigger", trigger)
      // eslint-disable-next-line  @typescript-eslint/no-non-null-assertion
      .if(triggerValue, (query) => query.where("trigger_value", triggerValue!))
      .if(triggerValue2, (query) =>
        // eslint-disable-next-line  @typescript-eslint/no-non-null-assertion
        query.where("trigger_value_2", triggerValue2!),
      )
      .first();

    if (email === null) {
      return;
    }

    await this.sendToParticipant(event, participant, email);
  }

  static async sendToParticipant(
    event: Event,
    participant: Participant,
    email: Email,
  ) {
    return [email, event, participant];
  }
}
