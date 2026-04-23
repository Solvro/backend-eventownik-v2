import { inject } from "@adonisjs/core";
import { MultipartFile } from "@adonisjs/core/bodyparser";

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

  async checkFormClosure(form: Form): Promise<boolean> {
    return form.isOpen;
    /*if (!form.isOpen) {
      return false;
    }

    const now = new Date();

    if (form.startDate.toJSDate() > now) {
      form.isOpen = false;
      return false;
    }

    if (form.endDate !== null && form.endDate.toJSDate() < now) {
      form.isOpen = false;
      await form.save();
      return false;
    } else if (form.submissionsLeft !== null && form.submissionsLeft <= 0) {
      form.isOpen = false;
      return false;
    }
    return true;*/
  }

  async submitForm(
    eventSlug: string,
    form: Form,
    formSubmitDTO: FormSubmitDTO,
  ): Promise<void | { status: number; error: object }> {
    const event = await Event.findByOrFail("slug", eventSlug);
    const {
      email: participantEmail,
      participantSlug,
      ...attributes
    } = formSubmitDTO;

    if (!(await this.checkFormClosure(form))) {
      return {
        status: 400,
        error: { message: "Form closed" },
      };
    }

    const normalizedAttributes: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(
      attributes as Record<string, unknown>,
    )) {
      if (value === null || value === "null" || value === "") {
        normalizedAttributes[key] = null;
      } else if (value !== undefined) {
        normalizedAttributes[key] = value;
      }
    }

    if (form.isFirstForm && participantEmail === undefined) {
      return {
        status: 400,
        error: { missingRequiredFields: { name: "email" } },
      };
    } else if (!form.isFirstForm && participantSlug === undefined) {
      return {
        status: 400,
        error: { missingRequiredFields: { name: "participantSlug" } },
      };
    }

    const fileAttributesIds = new Set(
      form.attributes
        .filter(
          (attribute) =>
            attribute.type === "file" || attribute.type === "drawing",
        )
        .map((attribute) => attribute.id),
    );

    const blockAttributesIds = new Set(
      form.attributes
        .filter((attribute) => attribute.type === "block")
        .map((attribute) => attribute.id),
    );

    const allowedFieldsIds = form.attributes.map((attribute) =>
      attribute.id.toString(),
    );

    let participant: Participant | null = null;

    if (participantSlug !== undefined) {
      participant = await Participant.findByOrFail("slug", participantSlug);

      await participant.load("attributes", (q) => {
        void q.pivotColumns(["value"]);
        void q.whereIn("attributes.id", allowedFieldsIds);
      });
    }

    const missingRequiredFields = form.attributes
      .filter((attribute) => {
        const isRequired =
          attribute.$extras.pivot_is_required === 1 ||
          attribute.$extras.pivot_is_required === true ||
          attribute.$extras.pivot_is_required === "1";

        if (!isRequired) {
          return false;
        }

        const val = normalizedAttributes[attribute.id.toString()];

        if (val === null) {
          return true;
        }

        if (val !== undefined) {
          return false;
        }

        return !(
          participant?.attributes.some((x) => x.id === attribute.id) ?? false
        );
      })
      .map((attribute) => ({
        id: attribute.id,
        name: attribute.name,
        message:
          attribute.type === "block"
            ? "You must select a valid option and cannot unregister."
            : undefined,
      }));

    if (missingRequiredFields.length > 0) {
      return {
        status: 400,
        error: { missingRequiredFields },
      };
    }

    const formFields = filterObjectFields(
      normalizedAttributes,
      allowedFieldsIds,
    );

    const transformedFormFieldsResults = await Promise.all(
      Object.entries(formFields).map(async ([attributeIdStr, value]) => {
        const attributeId = +attributeIdStr;
        const attribute = form.attributes.find((a) => a.id === attributeId);

        if (!attribute) {
          return [];
        }

        // file handling
        if (
          fileAttributesIds.has(attributeId) &&
          value !== null &&
          value !== "null"
        ) {
          const fileName = await this.fileService.storeFile(
            value as MultipartFile,
          );

          if (fileName === undefined) {
            return {
              status: 500,
              error: { message: "Error while saving a file" },
            };
          }

          return [{ attributeId, value: fileName }];
        }

        // block handling
        if (
          blockAttributesIds.has(attributeId) &&
          value !== null &&
          value !== "null"
        ) {
          const values = [...new Set(Array.isArray(value) ? value : [value])];

          if (values.length === 0) {
            return [{ attributeId, value: null }];
          }

          if (values.length > 1 && !attribute.isMultiple) {
            return {
              status: 400,
              error: {
                message: `Multiple selections are not allowed for attribute ${attribute.name}`,
              },
            };
          }

          if (
            attribute.maxSelections &&
            values.length > attribute.maxSelections
          ) {
            return {
              status: 400,
              error: {
                message: `Maximum ${attribute.maxSelections} selections allowed for attribute ${attribute.name}`,
              },
            };
          }

          const results: { attributeId: number; value: string | null }[] = [];
          for (const val of values) {
            const blockId = Number(val);

            if (Number.isNaN(blockId)) {
              return {
                status: 400,
                error: {
                  message: `Invalid block ID format for attribute ${attribute.name}`,
                },
              };
            }

            const canSignInToBlock = await this.blockService.canSignInToBlock(
              attributeId,
              blockId,
            );

            if (!canSignInToBlock) {
              return {
                status: 400,
                error: {
                  message: `Block is full for attribute ${attribute.name}`,
                },
              };
            }
            results.push({ attributeId, value: String(blockId) });
          }
          return results;
        }

        // select/multiselect handling
        if (
          attribute !== undefined &&
          (attribute.type === "select" || attribute.type === "multiselect")
        ) {
          if (value !== null && value !== "null") {
            let parsedOptions: string[] = [];
            if (typeof attribute.options === "string") {
              try {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                parsedOptions = JSON.parse(attribute.options);
              } catch {
                parsedOptions = [];
              }
            } else if (Array.isArray(attribute.options)) {
              parsedOptions = attribute.options;
            }
            parsedOptions = parsedOptions.map((v) => String(v));

            if (attribute.type === "multiselect") {
              let selectedValues: string[] = [];
              if (Array.isArray(value)) {
                selectedValues = value.map((v) => String(v));
              } else {
                const valStr = String(value as string | number | boolean);
                try {
                  const parsed: unknown = JSON.parse(valStr);
                  if (Array.isArray(parsed)) {
                    selectedValues = (parsed as unknown[]).map((v) =>
                      String(v),
                    );
                  } else {
                    selectedValues = [String(valStr)];
                  }
                } catch {
                  if (valStr.includes(",")) {
                    selectedValues = valStr.split(",");
                  } else {
                    selectedValues = [valStr];
                  }
                }
              }

              if (!attribute.allowOther) {
                const invalidOption = selectedValues.find(
                  (v) => !parsedOptions.includes(v),
                );

                if (invalidOption !== undefined) {
                  return {
                    status: 400,
                    error: {
                      message: `Invalid option selected for attribute ${attribute.name} - Option ${invalidOption} not found in ${JSON.stringify(parsedOptions)}`,
                    },
                  };
                }
              }

              return [
                {
                  attributeId,
                  value: selectedValues.join(","),
                },
              ];
            } else {
              const valStr = String(value as string | number | boolean);
              if (!attribute.allowOther && !parsedOptions.includes(valStr)) {
                return {
                  status: 400,
                  error: {
                    message: `Invalid option selected for attribute ${attribute.name} - Option ${valStr} not found in ${JSON.stringify(parsedOptions)}`,
                  },
                };
              }
              return [{ attributeId, value: valStr }];
            }
          }
        }

        return [
          {
            attributeId,
            value: value as string | null,
          },
        ];
      }),
    );

    for (const res of transformedFormFieldsResults) {
      if (!Array.isArray(res)) {
        return res;
      }
    }

    const transformedFormFields = transformedFormFieldsResults.flat() as {
      attributeId: number;
      value: string | null;
    }[];

    if (participantEmail !== undefined) {
      participant = await this.participantService.createParticipant(event.id, {
        email: participantEmail,
        participantAttributes: transformedFormFields,
      });
      await EmailService.sendOnTrigger(
        event,
        participant,
        "form_filled",
        form.id,
      );
    } else if (participantSlug !== undefined) {
      participant = await Participant.findByOrFail("slug", participantSlug);
      await this.participantService.updateParticipant(
        event.id,
        participant.id,
        { email: undefined, participantAttributes: transformedFormFields },
      );
      await EmailService.sendOnTrigger(
        event,
        participant,
        "form_filled",
        form.id,
      );
    }

    if (form.submissionsLeft !== null) {
      form.submissionsLeft -= 1;
      await form.save();
    }
  }
}
