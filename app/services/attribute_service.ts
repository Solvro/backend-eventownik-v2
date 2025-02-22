import Attribute from "#models/attribute";

export class AttributeService {
  async getEventAttributes(eventId: number) {
    const attributes = await Attribute.findManyBy("event_id", eventId);

    return attributes;
  }
}
