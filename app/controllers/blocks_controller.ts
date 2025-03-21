import type { HttpContext } from "@adonisjs/core/http";

import Block from "#models/block";
import { createBlockValidator, updateBlockValidator } from "#validators/block";

export default class BlocksController {
  /**
   * @index
   * @operationId getBlocks
   * @description Return a list of all blocks.
   * @responseBody 200 - <Block[]>.paginated()
   * @tag blocks
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
   * @responseBody 200 - <Block>
   * @responseBody 404 - { "message": "Row not found", "name": "Exception", "status": 404 }
   * @tag blocks
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
   * @summary Store a new block
   * @description Store a new block. Note: parentId can be null.
   * @requestBody <createBlockValidator>
   * @responseBody 200 - <Block>
   * @tag blocks
   */

  async store({ request }: HttpContext) {
    const data = await createBlockValidator.validate(request.all());
    const block = await Block.create(data);

    return { message: "Block successfully created.", block };
  }

  /**
   * @update
   * @operationId updateBlock
   * @description Updates a block with given ID
   * @requestBody <updateBlockValidator>
   * @responseBody 200 - <Block>
   * @responseBody 404 - { "message": "Row not found", "name": "Exception", "status": 404 }
   * @tag blocks
   */

  async update({ params, request }: HttpContext) {
    const data = await updateBlockValidator.validate(request.all());
    const block = await Block.findOrFail(params.id);
    block.merge(data);
    await block.save();

    return { message: "Block successfully updated.", block };
  }

  /**
   * @destroy
   * @operationId destroyBlock
   * @description Destroys a block with given ID
   * @responseBody 200 - { "message": "Block successfully deleted." }
   * @responseBody 404 - { "message": "Row not found", "name": "Exception", "status": 404 }
   * @tag blocks
   */

  async destroy(ctx: HttpContext) {
    const block = await this.show(ctx);
    await block.delete();

    return { message: "Block successfully deleted." };
  }
}
