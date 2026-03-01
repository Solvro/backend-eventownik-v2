import { inject } from "@adonisjs/core";

import Attribute from "#models/attribute";
import Block from "#models/block";
import {
  createAttributeValidator,
  updateAttributeValidator,
} from "#validators/attribute";

import {
  BulkAttributeDTO,
  CreateAttributeDTO,
  UpdateAttributeDTO,
} from "../types/attribute_types.js";
import { BlockService } from "./block_service.js";

@inject()
export class AttributeService {
  // eslint-disable-next-line no-useless-constructor
  constructor(private blockService: BlockService) {}

  async getEventAttributes(eventId: number) {
    const attributes = await Attribute.findManyBy("event_id", eventId);

    return attributes;
  }

  async getEventAttribute(eventId: number, attributeId: number) {
    const attribute = await Attribute.query()
      .where("event_id", eventId)
      .andWhere("id", attributeId)
      .firstOrFail();

    return attribute;
  }

  async createAttribute(createAttributeDTO: CreateAttributeDTO) {
    const optionsJSON: string | null =
      createAttributeDTO.options !== undefined
        ? JSON.stringify(createAttributeDTO.options)
        : null;

    const newAttribute = await Attribute.create({
      ...createAttributeDTO,
      options: optionsJSON,
    });

    if (newAttribute.type === "block") {
      await this.blockService.createRootBlock(newAttribute.id);
    }

    return newAttribute;
  }

  async updateAttribute(
    eventId: number,
    attributeId: number,
    updates: UpdateAttributeDTO,
  ) {
    const attributeToUpdate = await this.getEventAttribute(
      eventId,
      attributeId,
    );

    const previousType = attributeToUpdate.type;

    const optionsJSON: string | undefined =
      updates.options !== undefined
        ? JSON.stringify(updates.options)
        : undefined;

    attributeToUpdate.merge({
      ...updates,
      options: optionsJSON,
    });

    await attributeToUpdate.save();

    const updatedAttribute = await this.getEventAttribute(eventId, attributeId);

    if (previousType === "block") {
      await updatedAttribute.load("rootBlock");

      if (updatedAttribute.type !== "block") {
        await updatedAttribute.rootBlock.delete();
      }
    } else if (updatedAttribute.type === "block") {
      await this.blockService.createRootBlock(updatedAttribute.id);
    }

    return await this.getEventAttribute(eventId, attributeId);
  }

  async deleteAttribute(eventId: number, attributeId: number) {
    await Block.query().where("attribute_id", attributeId).delete();
    await Attribute.query()
      .where("event_id", eventId)
      .andWhere("id", attributeId)
      .delete();
  }

  async bulkUpdateAttributes(eventId: number, data: BulkAttributeDTO) {
    const results = [];
    for (const item of data) {
      if (item.id) {
        // Update
        const updates = await updateAttributeValidator.validate(item, {
          meta: { eventId, attributeId: item.id },
        });
        results.push(await this.updateAttribute(eventId, item.id, updates));
      } else {
        // Create
        const newItemData = await createAttributeValidator.validate(item, {
          meta: { eventId },
        });
        results.push(await this.createAttribute({ eventId, ...newItemData }));
      }
    }
    return results;
  }
}
