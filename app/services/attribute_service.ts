import Attribute from "#models/attribute";

import {
  CreateAttributeDTO,
  UpdateAttributeDTO,
} from "../types/attribute_types.js";

export class AttributeService {
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
    const newAttribute = await Attribute.create(createAttributeDTO);

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

    attributeToUpdate.merge(updates);

    await attributeToUpdate.save();

    const updatedAttribute = await this.getEventAttribute(eventId, attributeId);

    return updatedAttribute;
  }
}
