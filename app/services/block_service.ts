import string from "@adonisjs/core/helpers/string";

import Attribute from "#models/attribute";
import Block from "#models/block";
import Participant from "#models/participant";

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

    await Promise.all(block.children.map((child) => this.loadBlockTree(child)));

    let participantsInBlockCount;

    if (block.capacity !== null) {
      participantsInBlockCount = await this.getBlockParticipantsCount(
        block.attributeId,
        block.id,
      );

      block.$extras.participantsInBlockCount = participantsInBlockCount;
    }

    return block;
  }

  async getBlockParticipants(attributeId: number, blockId: number) {
    const participantsInBlock = await Participant.query().whereHas(
      "attributes",
      (query) => {
        void query.where("attributes.id", attributeId);
        void query.where("participant_attributes.value", "like", blockId);
      },
    );

    return participantsInBlock;
  }

  async getBlockParticipantsCount(
    attributeId: number,
    blockId: number,
  ): Promise<number> {
    const blockParticipantsCount = await Participant.query()
      .whereHas("attributes", (query) => {
        void query.where("attributes.id", attributeId);
        void query.where("participant_attributes.value", "like", blockId);
      })
      .count("*");

    return +blockParticipantsCount[0].$extras.count;
  }

  async canSignInToBlock(attributeId: number, blockId: number) {
    const block = await Block.query()
      .where("id", blockId)
      .andWhere("attribute_id", attributeId)
      .firstOrFail();

    const blockParticipantsCount = await this.getBlockParticipantsCount(
      attributeId,
      blockId,
    );

    return block.capacity !== null && block.capacity > blockParticipantsCount;
  }

  async createRootBlock(attributeId: number) {
    const attribute = await Attribute.query()
      .where("id", attributeId)
      .preload("rootBlock")
      .firstOrFail();

    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (attribute.rootBlock !== null) {
      await attribute.rootBlock.delete();
    }

    await attribute.related("blocks").create({
      name: string.slug(`${attribute.slug ?? attribute.name}-root-block`, {
        lower: true,
      }),
      isRootBlock: true,
    });
  }
}
