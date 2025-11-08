import string from "@adonisjs/core/helpers/string";

import Attribute from "#models/attribute";
import Block from "#models/block";
import Participant from "#models/participant";

export class BlockService {
  async getBlockTree(attributeUuid: string) {
    const blockAttribute = await Attribute.query()
      .where("uuid", attributeUuid)
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

    block.children.sort(
      (a, b) => a.createdAt.toMillis() - b.createdAt.toMillis(),
    );

    const participants = await Participant.query()
      .whereHas("attributes", (query) => {
        void query.where("attributes.uuid", String(block.attributeUuid));
        void query.where("participant_attributes.value", block.uuid);
      })
      .preload("attributes", (q) => {
        void q.whereIn("slug", participantFields);
        void q.pivotColumns(["value"]);
      });

    block.$extras.participants = participants.map(
      (participant: Participant) => {
        return {
          id: participant.uuid,
          email: participant.email,
          name: (participant?.attributes ?? []).reduce(
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

  async getBlockParticipants(attributeUuid: string, blockUuid: string) {
    const participantsInBlock = await Participant.query().whereHas(
      "attributes",
      (query) => {
        void query.where("attributes.uuid", attributeUuid);
        void query.where("participant_attributes.value", "like", blockUuid);
      },
    );

    return participantsInBlock;
  }

  async getBlockParticipantsCount(
    attributeUuid: string,
    blockUuid: string,
  ): Promise<number> {
    const blockParticipantsCount = await Participant.query()
      .whereHas("attributes", (query) => {
        void query.where("attributes.uuid", attributeUuid);
        void query.where("participant_attributes.value", "like", blockUuid);
      })
      .count("*");

    return +blockParticipantsCount[0].$extras.count;
  }

  async canSignInToBlock(attributeUuid: string, blockUuid: string) {
    const block = await Block.query()
      .where("uuid", blockUuid)
      .andWhere("attributeUuid", attributeUuid)
      .firstOrFail();

    const blockParticipantsCount = await this.getBlockParticipantsCount(
      attributeUuid,
      blockUuid,
    );

    return (
      block.capacity === null ||
      block.capacity === 0 ||
      block.capacity === undefined ||
      block.capacity > blockParticipantsCount
    );
  }

  async createRootBlock(attributeUuid: string) {
    const attribute = await Attribute.query()
      .where("uuid", attributeUuid)
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
    });
  }
}
