import string from "@adonisjs/core/helpers/string";

import Attribute from "#models/attribute";
import Block from "#models/block";
import Participant from "#models/participant";

export class BlockService {
  async getBlockTree(attributeId: number) {
    const blockAttribute = await Attribute.query()
      .where("id", attributeId)
      .preload("rootBlock", (q) => q.preload("attribute"))
      .firstOrFail();

    const rootBlock = blockAttribute.rootBlock;

    const blockTree = await this.loadBlockTree(
      rootBlock,
      String(rootBlock.attribute.options).split(","),
    );

    return blockTree;
  }

  async loadBlockTree(block: Block, participantFields: string[]) {
    await block.load("children");

    await Promise.all(
      block.children.map((child) =>
        this.loadBlockTree(child, participantFields),
      ),
    );

    const participants = await Participant.query()
      .whereHas("attributes", (query) => {
        void query.where("attributes.id", block.attributeId);
        void query.where("participant_attributes.value", block.id);
      })
      .preload("attributes", (q) => {
        void q.whereIn("slug", participantFields);
        void q.pivotColumns(["value"]);
      });

    block.$extras.participants = participants.map(
      (participant: Participant) => {
        return {
          id: participant.id,
          email: participant.email,
          name: participant.attributes.reduce(
            (a: string, b) => `${a} ${b.$extras.pivot_value ?? ""}`,
            "",
          ),
        };
      },
    );

    block.$extras.participantsInBlockCount = (
      block.$extras.participants as Participant[]
    ).length;

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
