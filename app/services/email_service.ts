import { DateTime } from "luxon";

import { cuid } from "@adonisjs/core/helpers";
import { Message } from "@adonisjs/mail";
import mail from "@adonisjs/mail/services/main";

import Email from "#models/email";
import Event from "#models/event";
import Form from "#models/form";
import Participant from "#models/participant";

import { EmailTriggerType } from "../types/trigger_types.js";

export class EmailService {
  static async sendOnTrigger(
    event: Event,
    participant: Participant,
    trigger: EmailTriggerType,
    triggerValue?: string | number, // used for example as attribute id in trigger attribute_changed
    triggerValue2?: string, // used for example as attribute value in trigger attribute_changed
    form?: Form,
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
      .preload("form")
      .first();

    if (email === null) {
      return;
    }

    await this.sendToParticipant(event, participant, email, form);
  }

  static async sendToParticipant(
    event: Event,
    participant: Participant,
    email: Email,
    sendBy = "system",
  ) {
    console.log(form);
    await participant
      .related("emails")
      .attach({ [email.id]: { status: "pending", send_by: sendBy } });
    await participant.load("attributes", (q) => q.pivotColumns(["value"]));
    await event.load("mainOrganizer");

    await mail.sendLater(async (message) => {
      message
        .to(participant.email)
        .from("eventownik@solvro.pl", event.name)
        .subject(email.name)
        .replyTo(event.contactEmail ?? event.mainOrganizer.email)
        .html(this.parseContent(event, participant, email, message));

      await participant
        .related("emails")
        .sync(
          { [email.id]: { status: "sent", send_at: DateTime.now() } },
          false,
        );
    });
  }

  static parseContent(
    event: Event,
    participant: Participant,
    email: Email,
    message: Message,
  ) {
    const content = email.content;
    let parsedContent = content
      .replace(/\/event_name/g, event.name)
      .replace(
        /\/event_start_date/g,
        event.startDate.toFormat("yyyy-MM-dd HH:mm"),
      )
      .replace(/\/event_end_date/g, event.endDate.toFormat("yyyy-MM-dd HH:mm"))
      .replace(/\/event_slug/g, event.slug)
      .replace(/\/event_primary_color/g, event.primaryColor ?? "")
      .replace(/\/event_location/g, event.location ?? "")
      .replace(/\/participant_id/g, String(participant.id))
      .replace(
        /\/participant_created_at/g,
        participant.createdAt.toFormat("yyyy-MM-dd HH:mm"),
      )
      .replace(
        /\/participant_updated_at/g,
        participant.updatedAt.toFormat("yyyy-MM-dd HH:mm"),
      )
      .replace(/\/participant_email/g, participant.email)
      .replace(/\/participant_slug/g, participant.slug)
      .replace(
        /data:image\/(\w+);base64,([^"]+)/g,
        (_match, format, base64: string) => {
          const cid = cuid();
          message.nodeMailerMessage.attachments =
            message.nodeMailerMessage.attachments ?? [];
          message.nodeMailerMessage.attachments.push({
            content: Buffer.from(base64, "base64"),
            encoding: "base64",
            filename: `${cid}.${format}`,
            cid,
          });
          return `cid:${cid}`;
        },
      );

    if (form !== undefined) {
      parsedContent = parsedContent.replace(
        /\/form_url/g,
        `${process.env.DOMAIN}/${event.slug}/${form.slug}/${participant.slug}`,
      );
    }

    for (const attribute of participant.attributes) {
      parsedContent = parsedContent.replace(
        new RegExp(`/participant_${attribute.slug}`, "g"),
        attribute.$extras.pivot_value as string,
      );
    }

    return parsedContent;
  }
}
