import { inject } from "@adonisjs/core";
import { MultipartFile } from "@adonisjs/core/bodyparser";
import { Exception } from "@adonisjs/core/exceptions";

import Event from "#models/event";
import Form from "#models/form";
import Participant from "#models/participant";

import { FormSubmitDTO } from "../types/form_types.js";
import { filterObjectFields } from "../utils/filter_object_fields.js";
import { BlockService } from "./block_service.js";
import { EmailService } from "./email_service.js";
import { FileService } from "./file_service.js";
import { ParticipantService } from "./participant_service.js";

@inject()
export class FormService {
  // eslint-disable-next-line no-useless-constructor
  constructor(
    private participantService: ParticipantService,
    private fileService: FileService,
    private blockService: BlockService,
  ) {}

  async submitForm(
    eventSlug: string,
    formUuid: string,
    formSubmitDTO: FormSubmitDTO,
  ): Promise<void | { status: number; error: object }> {
    const event = await Event.findByOrFail("slug", eventSlug);

    const form = await Form.query()
      .where("uuid", formUuid)
      .andWhere("eventUuid", event.uuid)
      .preload("attributes", async (query) => {
        await query.pivotColumns(["is_required"]);
      })
      .firstOrFail();

    const {
      email: participantEmail,
      participantSlug,
      ...attributes
    } = formSubmitDTO;

    if (participantEmail === undefined) {
      return {
        status: 400,
        error: { missingRequiredFields: { name: "email" } },
      };
    }

    const fileAttributesIds = new Set(
      form.attributes
        .filter((attribute) => attribute.type === "file")
        .map((attribute) => attribute.uuid),
    );

    const blockAttributesIds = new Set(
      form.attributes
        .filter((attribute) => attribute.type === "block")
        .map((attribute) => attribute.uuid),
    );

    const allowedFieldsIds = form.attributes.map((attribute) =>
      attribute.uuid.toString(),
    );

    let participant: Participant | null = null;

    if (participantSlug !== undefined) {
      participant = await Participant.findByOrFail("slug", participantSlug);

      await participant.load("attributes", (q) => {
        void q.pivotColumns(["value"]);
        void q.whereIn("attributes.uuid", allowedFieldsIds);
      });
    }

    const missingRequiredFields = form.attributes
      .filter(
        (attribute): boolean =>
          attribute.$extras.pivot_is_required === true &&
          !(
            participant?.attributes.some((x) => x.uuid === attribute.uuid) ??
            false
          ),
      )
      .filter((attribute) => !(attribute.uuid in attributes))
      .map((attribute) => ({
        id: attribute.uuid,
        name: attribute.name,
      }));

    if (missingRequiredFields.length > 0) {
      return {
        status: 400,
        error: { missingRequiredFields },
      };
    }

    const formFields = filterObjectFields(attributes, allowedFieldsIds);

    const transformedFormFields = await Promise.all(
      Object.entries(formFields).map(async ([attributeUuid, value]) => {
        if (
          fileAttributesIds.has(attributeUuid) &&
          value !== null &&
          value !== "null"
        ) {
          const fileName = await this.fileService.storeFile(
            value as MultipartFile,
          );

          if (fileName === undefined) {
            throw new Exception("Error while saving a file");
          }

          return {
            attributeUuid,
            value: fileName,
          };
        } else if (
          blockAttributesIds.has(attributeUuid) &&
          value !== null &&
          value !== "null"
        ) {
          const canSignInToBlock = await this.blockService.canSignInToBlock(
            attributeUuid,
            value as string,
          );

          if (!canSignInToBlock) {
            throw new Exception("Block is full");
          }
        }

        return {
          attributeUuid,
          value: value as string | null,
        };
      }),
    );

    if (participantEmail !== undefined) {
      participant = await this.participantService.createParticipant(
        event.uuid,
        {
          email: participantEmail,
          participantAttributes: transformedFormFields,
        },
      );
      await EmailService.sendOnTrigger(
        event,
        participant,
        "form_filled",
        form.uuid,
      );
    } else if (participantSlug !== undefined) {
      participant = await Participant.findByOrFail("slug", participantSlug);
      await this.participantService.updateParticipant(
        event.uuid,
        participant.uuid,
        { email: undefined, participantAttributes: transformedFormFields },
      );
      await EmailService.sendOnTrigger(
        event,
        participant,
        "form_filled",
        form.uuid,
      );
    }
  }
}
