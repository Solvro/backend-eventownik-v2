import { DateTime } from "luxon";

import { cuid } from "@adonisjs/core/helpers";
import { Message } from "@adonisjs/mail";
import mail from "@adonisjs/mail/services/main";

import Block from "#models/block";
import Email from "#models/email";
import Event from "#models/event";
import Participant from "#models/participant";
import env from "#start/env";

import { EmailTriggerType } from "../types/trigger_types.js";

export class EmailService {
  private static async getBlockDisplayValue(
    raw: string | number | null | undefined,
  ): Promise<string> {
    if (raw === null || raw === "null" || raw === undefined || raw === "") {
      return "N/A";
    }

    const blockId = Number(raw);

    if (Number.isFinite(blockId)) {
      const block = await Block.find(blockId);

      if (block !== null) {
        return block.name;
      }
    }

    return "N/A";
  }

  static async sendOnTrigger(
    event: Event,
    participant: Participant,
    trigger: EmailTriggerType,
    triggerValue?: string | number, // used for example as attribute id in trigger attribute_changed
    triggerValue2?: string | null, // used for example as attribute value in trigger attribute_changed
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
    sendBy = "system",
  ) {
    await email.load("form");
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
        .html(await this.parseContent(event, participant, email, message));

      await participant
        .related("emails")
        .sync(
          { [email.id]: { status: "sent", send_at: DateTime.now() } },
          false,
        );
    });
  }

  static async parseContent(
    event: Event | null,
    participant: Participant,
    email: Email,
    message: Message,
  ) {
    if (event === null) {
      return email.content;
    }

    //TODO: change to the actual date of tag logic change
    const tagLogicChangeDate = DateTime.fromObject(
      {
        year: 2025,
        month: 11,
        day: 9,
        hour: 23,
        minute: 23,
      },
      { zone: "Europe/Warsaw" },
    );

    if (email.createdAt < tagLogicChangeDate) {
      return await this.parseContentLegacy(event, participant, email, message);
    } else {
      await event.load("forms");

      // eslint-disable-next-line @typescript-eslint/no-shadow
      let parsedContent = email.content;

      const tagRegex = /<span[^>]*data-id="([^"]+)"[^>]*>.*?<\/span>/g;

      parsedContent = parsedContent.replace(
        tagRegex,
        (_match, dataId: string) => {
          switch (dataId) {
            case "/event_name":
              return event.name;
            case "/event_start_date":
              return event.startDate.toFormat("yyyy-MM-dd HH:mm");
            case "/event_end_date":
              return event.endDate.toFormat("yyyy-MM-dd HH:mm");
            case "/event_slug":
              return event.slug;
            case "/event_primary_color":
              return event.primaryColor ?? "";
            case "/event_location":
              return event.location ?? "";
            case "/participant_id":
              return String(participant.id);
            case "/participant_created_at":
              return participant.createdAt.toFormat("yyyy-MM-dd HH:mm");
            case "/participant_updated_at":
              return participant.updatedAt.toFormat("yyyy-MM-dd HH:mm");
            case "/participant_email":
              return participant.email;
            case "/participant_slug":
              return participant.slug;
            default:
              return dataId;
          }
        },
      );

      parsedContent = parsedContent.replace(
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
            contentType: `image/${format}`,
          });
          return `cid:${cid}`;
        },
      );

      for (const attribute of participant.attributes) {
        const raw = attribute.$extras.pivot_value as
          | string
          | number
          | null
          | undefined;

        let replacementValue: string;
        if (attribute.type === "block") {
          replacementValue = await EmailService.getBlockDisplayValue(raw);
        } else if (raw === null || raw === undefined) {
          replacementValue = "";
        } else {
          replacementValue = typeof raw === "string" ? raw : String(raw);
        }

        parsedContent = parsedContent.replace(
          new RegExp(`/participant_${attribute.slug}`, "g"),
          replacementValue,
        );
      }

      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition,@typescript-eslint/no-shadow
      for (const [, form] of (event.forms ?? []).entries()) {
        const formUrl = `${env.get("APP_DOMAIN")}/${event.slug}/${form.slug}/${participant.slug}`;
        const formRegex = new RegExp(
          `/form_${form.slug.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`,
          "g",
        );
        parsedContent = parsedContent.replace(
          formRegex,
          // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
          `<a href="${formUrl}">${form.name ?? "Formularz"}</a>`,
        );
      }

      return parsedContent;
    }
  }

  static async parseContentLegacy(
    event: Event | null,
    participant: Participant,
    email: Email,
    message: Message,
  ) {
    if (event === null) {
      return email.content;
    }

    const content = email.content;
    const { form } = email;
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

    if (form !== null) {
      parsedContent = parsedContent.replace(
        /\/form_url/g,
        `${env.get("APP_DOMAIN")}/${event.slug}/${form.slug}/${participant.slug}`,
      );
      return parsedContent;
    }

    for (const attribute of participant.attributes) {
      const raw = attribute.$extras.pivot_value as
        | string
        | number
        | null
        | undefined;

      let replacementValue: string;
      if (attribute.type === "block") {
        replacementValue = await EmailService.getBlockDisplayValue(raw);
      } else if (raw === null || raw === undefined) {
        replacementValue = "";
      } else {
        replacementValue = typeof raw === "string" ? raw : String(raw);
      }

      parsedContent = parsedContent.replace(
        new RegExp(`/participant_${attribute.slug}`, "g"),
        replacementValue,
      );
    }

    return parsedContent;
  }
}
