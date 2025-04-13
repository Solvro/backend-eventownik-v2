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

    for (const child of block.children) {
      await this.loadBlockTree(child);
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
}
