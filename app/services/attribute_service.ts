import Attribute from "#models/attribute";

import { CreateAttributeDTO } from "../types/attribute_types.js";

export class AttributeService {
  async getEventAttributes(eventId: number) {
    const attributes = await Attribute.findManyBy("event_id", eventId);

    return attributes;
  }

  async createAttribute(createAttributeDTO: CreateAttributeDTO) {
    const newAttribute = await Attribute.create(createAttributeDTO);

    return newAttribute;
  }
}
