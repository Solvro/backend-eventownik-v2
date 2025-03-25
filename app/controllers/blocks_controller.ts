import type { HttpContext } from "@adonisjs/core/http";

import Block from "#models/block";
import { createBlockValidator, updateBlockValidator } from "#validators/block";

export default class BlocksController {
  /**
   * @index
   * @operationId getBlocks
   * @description Return a list of all blocks.
   * @tag blocks
   * @responseBody 200 - <Block[]>.paginated()
   */

  async index({ request }: HttpContext) {
    return await Block.query().paginate(
      request.input("page", 1) | 1,
      request.input("perPage", 10) | 10,
    );
  }

  /**
   * @show
   * @operationId showBlock
   * @description Return a block with given ID.
   * @tag blocks
   * @responseBody 200 - <Block>
   * @responseBody 404 - { "message": "Row not found", "name": "Exception", "status": 404 }
   */

  async show({ params }: HttpContext) {
    const block = await Block.findOrFail(params.id);

    await block.load("parent");
    await block.load("children");

    return block;
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

  async store({ request, response }: HttpContext) {
    const data = await createBlockValidator.validate(request.all());
    const block = await Block.create(data);

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

  async update({ params, request }: HttpContext) {
    const data = await updateBlockValidator.validate(request.all());
    const block = await Block.findOrFail(params.id);
    block.merge(data);
    await block.save();

    return block;
  }

  /**
   * @destroy
   * @operationId destroyBlock
   * @description Destroys a block with given ID
   * @tag blocks
   * @responseBody 200 - { "message": "Block successfully deleted." }
   * @responseBody 404 - { "message": "Row not found", "name": "Exception", "status": 404 }
   */

  async destroy({ params, response }: HttpContext) {
    const block = await Block.findOrFail(params.id);
    await block.delete();
    await block.related("children").query().delete();

    return response.noContent();
  }
}
