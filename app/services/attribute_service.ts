import { inject } from "@adonisjs/core";

import Attribute from "#models/attribute";
import Block from "#models/block";

import {
  CreateAttributeDTO,
  UpdateAttributeDTO,
} from "../types/attribute_types.js";
import { BlockService } from "./block_service.js";

@inject()
export class AttributeService {
  // eslint-disable-next-line no-useless-constructor
  constructor(private blockService: BlockService) {}

  async getEventAttributes(eventUuid: string) {
    const attributes = await Attribute.findManyBy("eventUuid", eventUuid);

    return attributes;
  }

  async getEventAttribute(eventUuid: string, attributeUuid: string) {
    const attribute = await Attribute.query()
      .where("eventUuid", eventUuid)
      .andWhere("uuid", attributeUuid)
      .firstOrFail();

    return attribute;
  }

  async createAttribute(createAttributeDTO: CreateAttributeDTO) {
    const newAttribute = await Attribute.create({
      ...createAttributeDTO,
    });

    if (newAttribute.type === "block") {
      await this.blockService.createRootBlock(newAttribute.uuid);
    }

    return newAttribute;
  }

  async updateAttribute(
    eventUuid: string,
    attributeUuid: string,
    updates: UpdateAttributeDTO,
  ) {
    const attributeToUpdate = await this.getEventAttribute(
      eventUuid,
      attributeUuid,
    );

    const previousType = attributeToUpdate.type;

    attributeToUpdate.merge({
      ...updates,
    });

    await attributeToUpdate.save();

    const updatedAttribute = await this.getEventAttribute(
      eventUuid,
      attributeUuid,
    );

    if (previousType === "block") {
      await updatedAttribute.load("rootBlock");

      if (updatedAttribute.type !== "block") {
        await updatedAttribute.rootBlock.delete();
      }
    } else if (updatedAttribute.type === "block") {
      await this.blockService.createRootBlock(updatedAttribute.uuid);
    }

    return await this.getEventAttribute(eventUuid, attributeUuid);
  }

  async deleteAttribute(eventUuid: string, attributeUuid: string) {
    await Block.query().where("attributeUuid", attributeUuid).delete();
    await Attribute.query()
      .where("eventUuid", eventUuid)
      .andWhere("uuid", attributeUuid)
      .delete();
  }
}
