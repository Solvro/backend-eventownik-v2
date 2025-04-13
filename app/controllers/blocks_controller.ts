import { inject } from "@adonisjs/core";
import type { HttpContext } from "@adonisjs/core/http";

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
    const eventId = +params.eventId;
    const attributeId = +params.attributeId;

    await bouncer.authorize("manage_event", await Event.findOrFail(eventId));

    return await this.blockService.getBlockTree(attributeId);
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
    const eventId = +params.eventId;
    const attributeId = +params.attributeId;
    const blockId = +params.id;

    await bouncer.authorize("manage_event", await Event.findOrFail(eventId));

    const block = await Block.query()
      .where("id", blockId)
      .where("attribute_id", attributeId)
      .preload("parent")
      .preload("children")
      .preload("attribute")
      .firstOrFail();

    let participantsInBlock;

    if (block.capacity !== null) {
      participantsInBlock = await this.blockService.getBlockParticipants(
        attributeId,
        blockId,
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
    const eventId = +params.eventId;
    const attributeId = +params.attributeId;

    await bouncer.authorize("manage_event", await Event.findOrFail(eventId));

    const data = await request.validateUsing(createBlockValidator);

    const block = await Block.create({ ...data, attributeId });

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
    const eventId = +params.eventId;
    const attributeId = +params.attributeId;
    const blockId = +params.id;

    await bouncer.authorize("manage_event", await Event.findOrFail(eventId));

    const data = await request.validateUsing(updateBlockValidator);

    const block = await Block.query()
      .where("id", blockId)
      .andWhere("attribute_id", attributeId)
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
    const eventId = +params.eventId;
    const attributeId = +params.attributeId;
    const blockId = +params.id;

    await bouncer.authorize("manage_event", await Event.findOrFail(eventId));

    await Block.query()
      .where("id", blockId)
      .andWhere("attribute_id", attributeId)
      .delete();

    return response.noContent();
  }
}
