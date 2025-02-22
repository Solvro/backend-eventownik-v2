import { inject } from "@adonisjs/core";
import type { HttpContext } from "@adonisjs/core/http";

import { AttributeService } from "#services/attribute_service";

@inject()
export default class AttributesController {
  // eslint-disable-next-line no-useless-constructor
  constructor(private attributeService: AttributeService) {}

  /**
   * @index
   * @operationId getEventAttributes
   * @description Returns an array of attributes of a specified event
   * @tag attributes
   * @responseBody 200 - <Attribute[]>
   */
  async index({ params }: HttpContext) {
    const eventId = +params.eventId;

    const attributes = await this.attributeService.getEventAttributes(eventId);

    return attributes;
  }
}
