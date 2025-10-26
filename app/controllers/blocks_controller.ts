import { inject } from "@adonisjs/core";
import type { HttpContext } from "@adonisjs/core/http";

import Attribute from "#models/attribute";
import Block from "#models/block";
import Event from "#models/event";
import { BlockService } from "#services/block_service";
import { createBlockValidator, updateBlockValidator } from "#validators/block";

@inject()
export default class BlocksController {
  // eslint-disable-next-line no-useless-constructor
  constructor(private blockService: BlockService) {}

  /**
   * @index
   * @operationId getBlocks
   * @description Return a list of all blocks.
   * @tag blocks
   * @responseBody 200 - <Block[]>.paginated()
   */
  async index({ params, bouncer }: HttpContext) {
<<<<<<< Updated upstream
    const eventUuid = params.eventUuid as string;
    const attributeUuid = params.attributeUuid as string;
=======
    const eventId = +params.eventId;
    const attributeUuid = String(params.attributeUuid);
>>>>>>> Stashed changes

    await bouncer.authorize("manage_event", await Event.findOrFail(eventUuid));

    return await this.blockService.getBlockTree(attributeUuid);
  }

  /**
   * @publicIndex
   * @operationId publicGetBlocks
   * @description Return a list of all blocks.
   * @tag blocks
   * @responseBody 200 - <Block[]>.paginated()
   */
  async publicIndex({ params }: HttpContext) {
    const event = await Event.findByOrFail("slug", params.eventSlug);
    const attribute = await Attribute.query()
      .where("eventUuid", event.uuid)
      .where("uuid", params.attributeUuid as string)
      .firstOrFail();

    return await this.blockService.getBlockTree(attribute.uuid);
  }

  /**
   * @show
   * @operationId showBlock
   * @description Return a block with given ID.
   * @tag blocks
   * @responseBody 200 - <Block>
   * @responseBody 404 - { "message": "Row not found", "name": "Exception", "status": 404 }
   */
  async show({ params, bouncer }: HttpContext) {
    const eventUuid = params.eventUuid as string;
    const attributeUuid = params.attributeUuid as string;
    const blockUuid = params.uuid as string;

    await bouncer.authorize("manage_event", await Event.findOrFail(eventUuid));

    const block = await Block.query()
      .where("uuid", blockUuid)
      .where("attributeUuid", attributeUuid)
      .preload("parent")
      .preload("children")
      .preload("attribute")
      .firstOrFail();

    let participantsInBlock;

    if (block.capacity !== null) {
      participantsInBlock = await this.blockService.getBlockParticipants(
        attributeUuid,
        blockUuid,
      );
    }

    return { ...block.serialize(), participantsInBlock };
  }

  /**
   * @store
   * @operationId storeBlock
   * @description Store a new block. Note: parentId can be null.
   * @tag blocks
   * @summary Store a new block
   * @requestBody <createBlockValidator>
   * @responseBody 201 - <Block>
   */
  async store({ request, params, response, bouncer }: HttpContext) {
    const eventUuid = params.eventUuid as string;
    const attributeUuid = params.attributeUuid as string;

    await bouncer.authorize("manage_event", await Event.findOrFail(eventUuid));

    const data = await request.validateUsing(createBlockValidator);

    const block = await Block.create({ ...data, attributeUuid });

    return response.created(block);
  }

  /**
   * @update
   * @operationId updateBlock
   * @description Updates a block with given ID
   * @tag blocks
   * @requestBody <updateBlockValidator>
   * @responseBody 200 - <Block>
   * @responseBody 404 - { "message": "Row not found", "name": "Exception", "status": 404 }
   */
  async update({ params, request, bouncer }: HttpContext) {
    const eventUuid = params.eventUuid as string;
    const attributeUuid = params.attributeUuid as string;
    const blockUuid = params.uuid as string;

    await bouncer.authorize("manage_event", await Event.findOrFail(eventUuid));

    const data = await request.validateUsing(updateBlockValidator);

    const block = await Block.query()
      .where("uuid", blockUuid)
      .andWhere("attributeUuid", attributeUuid)
      .firstOrFail();

    block.merge(data);

    await block.save();

    return block;
  }

  /**
   * @destroy
   * @operationId destroyBlock
   * @description Destroys a block with given ID
   * @tag blocks
   * @responseBody 204 - No content
   * @responseBody 404 - { "message": "Row not found", "name": "Exception", "status": 404 }
   */
  async destroy({ params, response, bouncer }: HttpContext) {
    const eventUuid = params.eventUuid as string;
    const attributeUuid = params.attributeUuid as string;
    const blockUuid = params.uuid as string;

    await bouncer.authorize("manage_event", await Event.findOrFail(eventUuid));

    await Block.query()
      .where("uuid", blockUuid)
      .andWhere("attributeUuid", attributeUuid)
      .delete();

    return response.noContent();
  }
}
