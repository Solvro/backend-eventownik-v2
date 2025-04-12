import Attribute from "#models/attribute";
import Block from "#models/block";

export class BlockService {
  async getBlockTree(attributeId: number) {
    const blockAttribute = await Attribute.query()
      .where("id", attributeId)
      .preload("rootBlock")
      .firstOrFail();

    const rootBlock = blockAttribute.rootBlock;

    const blockTree = await this.loadBlockTree(rootBlock);

    return blockTree;
  }

  async loadBlockTree(block: Block) {
    await block.load("children");

    for (const child of block.children) {
      await this.loadBlockTree(child);
    }

    return block;
  }
}
