import { inject } from "@adonisjs/core";
import db from "@adonisjs/lucid/services/db";
import type { TransactionClientContract } from "@adonisjs/lucid/types/database";

import Attribute from "#models/attribute";
import Block from "#models/block";
import {
  createAttributeValidator,
  updateAttributeValidator,
} from "#validators/attribute";

import {
  BulkAttributeDTO,
  CreateAttributeDTO,
  UpdateAttributeDTO,
} from "../types/attribute_types.js";
import { BlockService } from "./block_service.js";

@inject()
export class AttributeService {
  // eslint-disable-next-line no-useless-constructor
  constructor(private blockService: BlockService) {}

  async getEventAttributes(eventId: number, trx?: TransactionClientContract) {
    const query = Attribute.query();
    if (trx) {
      query.useTransaction(trx);
    }
    const attributes = await query.where("event_id", eventId);

    return attributes;
  }

  async getEventAttribute(
    eventId: number,
    attributeId: number,
    trx?: TransactionClientContract,
  ) {
    const query = Attribute.query();
    if (trx) {
      query.useTransaction(trx);
    }
    const attribute = await query
      .where("event_id", eventId)
      .andWhere("id", attributeId)
      .firstOrFail();

    return attribute;
  }

  async createAttribute(
    createAttributeDTO: CreateAttributeDTO,
    trx?: TransactionClientContract,
  ): Promise<Attribute> {
    if (!trx) {
      return db.transaction(async (newTrx) => {
        return this.createAttribute(createAttributeDTO, newTrx);
      });
    }

    const optionsJSON: string | null =
      createAttributeDTO.options !== undefined
        ? JSON.stringify(createAttributeDTO.options)
        : null;

    const newAttribute = new Attribute();
    newAttribute.merge({
      ...createAttributeDTO,
      options: optionsJSON,
    });
    newAttribute.useTransaction(trx);
    await newAttribute.save();

    if (newAttribute.type === "block") {
      await this.blockService.createRootBlock(newAttribute.id, trx);
    }

    return newAttribute;
  }

  async updateAttribute(
    eventId: number,
    attributeId: number,
    updates: UpdateAttributeDTO,
    trx?: TransactionClientContract, // Add trx parameter
  ): Promise<Attribute> {
    if (!trx) {
      return db.transaction(async (newTrx) => {
        return this.updateAttribute(eventId, attributeId, updates, newTrx);
      });
    }

    const attributeToUpdate = await this.getEventAttribute(
      eventId,
      attributeId,
      trx,
    );

    const previousType = attributeToUpdate.type;

    const optionsJSON: string | undefined =
      updates.options !== undefined
        ? JSON.stringify(updates.options)
        : undefined;

    attributeToUpdate.merge({
      ...updates,
      options: optionsJSON,
    });

    attributeToUpdate.useTransaction(trx);
    await attributeToUpdate.save();

    const updatedAttribute = await this.getEventAttribute(
      eventId,
      attributeId,
      trx,
    );

    if (previousType === "block") {
      await updatedAttribute.load("rootBlock", (query) => {
        query.useTransaction(trx);
      });

      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (updatedAttribute.type !== "block" && updatedAttribute.rootBlock) {
        updatedAttribute.rootBlock.useTransaction(trx);
        await updatedAttribute.rootBlock.delete();
      }
    } else if (updatedAttribute.type === "block") {
      await this.blockService.createRootBlock(updatedAttribute.id, trx);
    }

    return await this.getEventAttribute(eventId, attributeId, trx);
  }

  async deleteAttribute(
    eventId: number,
    attributeId: number,
    trx?: TransactionClientContract,
  ): Promise<void> {
    if (!trx) {
      return db.transaction(async (newTrx) => {
        return this.deleteAttribute(eventId, attributeId, newTrx);
      });
    }

    const blockQuery = Block.query();
    blockQuery.useTransaction(trx);
    await blockQuery.where("attribute_id", attributeId).delete();

    const attributeQuery = Attribute.query();
    attributeQuery.useTransaction(trx);
    await attributeQuery
      .where("event_id", eventId)
      .andWhere("id", attributeId)
      .delete();
  }

  async bulkUpdateAttributes(eventId: number, data: BulkAttributeDTO) {
    // Only wait for transaction
    return db.transaction(async (trx) => {
      const results = [];
      for (const item of data) {
        if (item.id) {
          // Update
          const updates = await updateAttributeValidator.validate(item, {
            meta: { eventId, attributeId: item.id },
          });
          results.push(
            await this.updateAttribute(eventId, item.id, updates, trx),
          );
        } else {
          // Create
          const newItemData = await createAttributeValidator.validate(item, {
            meta: { eventId },
          });
          results.push(
            await this.createAttribute({ eventId, ...newItemData }, trx),
          );
        }
      }
      return results;
    });
  }
}
