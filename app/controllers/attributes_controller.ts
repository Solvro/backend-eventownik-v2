import { inject } from "@adonisjs/core";
import type { HttpContext } from "@adonisjs/core/http";

import { AttributeService } from "#services/attribute_service";
import {
  createAttributeValidator,
  updateAttributeValidator,
} from "#validators/attribute";

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

  /**
   * @store
   * @operationId addEventAttribute
   * @description Adds an attribute to an event
   * @tag attributes
   * @requestBody <createAttributeValidator>
   * @responseBody 201 - <Attribute>
   */
  async store({ params, request }: HttpContext) {
    const eventId = +params.eventId;

    const newAttributeData = await request.validateUsing(
      createAttributeValidator,
    );

    const newAttribute = await this.attributeService.createAttribute({
      eventId,
      ...newAttributeData,
    });

    return newAttribute;
  }

  /**
   * @show
   * @operationId getEventAttribute
   * @description Returns event attribute details
   * @tag attributes
   * @responseBody 200 - <Attribute>
   * @responseBody 404 - { "message": "Row not found", "name": "Exception", "status": 404 }
   */
  async show({ params }: HttpContext) {
    const eventId = +params.eventId;
    const attributeId = +params.id;

    const attribute = await this.attributeService.getEventAttribute(
      eventId,
      attributeId,
    );

    return attribute;
  }

  /**
   * @update
   * @operationId updateEventAttribute
   * @description Update event attribute details
   * @tag attributes
   * @requestBody <updateAttributeValidator>
   * @responseBody 200 - <Attribute>
   * @responseBody 404 - { "message": "Row not found", "name": "Exception", "status": 404 }
   */
  async update({ params, request }: HttpContext) {
    const eventId = +params.eventId;
    const attributeId = +params.id;

    const updates = await request.validateUsing(updateAttributeValidator);

    const updatedAttribute = this.attributeService.updateAttribute(
      eventId,
      attributeId,
      updates,
    );

    return updatedAttribute;
  }

  /**
   * @destroy
   * @operationId deleteEventAttribute
   * @description Deletes an attribute of an event
   * @tag attributes
   * @responseBody 204 - {}
   */
  async destroy({ params, response }: HttpContext) {
    const eventId = +params.eventId;
    const attributeId = +params.id;

    await this.attributeService.deleteAttribute(eventId, attributeId);

    return response.noContent();
  }
}
