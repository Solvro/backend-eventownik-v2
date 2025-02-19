import type { HttpContext } from "@adonisjs/core/http";

import Block from "#models/block";
import { createBlockValidator, updateBlockValidator } from "#validators/block";

export default class BlocksController {
  async index({ request }: HttpContext) {
    return await Block.query().paginate(
      request.input("page", 1) | 1,
      request.input("perPage", 10) | 10,
    );
  }

  async show({ params }: HttpContext) {
    const block = await Block.findOrFail(params.id);

    await block.load("parent");
    await block.load("children");

    return block;
  }

  async store({ request }: HttpContext) {
    const data = await createBlockValidator.validate(request.all());
    const block = await Block.create(data);

    return { message: "Block successfully created.", block };
  }

  async update({ params, request }: HttpContext) {
    const data = await updateBlockValidator.validate(request.all());
    const block = await Block.findOrFail(params.id);
    block.merge(data);
    await block.save();

    return { message: "Block successfully updated.", block };
  }

  async destroy(ctx: HttpContext) {
    const block = await this.show(ctx);
    await block.delete();

    return { message: "Block successfully deleted." };
  }
}
