import string from "@adonisjs/core/helpers/string";
import {
  BaseModel,
  afterCreate,
  belongsTo,
  column,
  hasMany,
} from "@adonisjs/lucid/orm";
import type { BelongsTo, HasMany } from "@adonisjs/lucid/types/relations";
import { DateTime } from "luxon";

import Admin from "./admin.js";
import Participant from "./participant.js";

// import Form from './Form.ts';

export default class Event extends BaseModel {
  @column({ isPrimary: true })
  declare id: number;

  @column()
  declare organizerId: number;

  @column()
  declare name: string;

  @column()
  declare description: string | null;

  @column()
  declare slug: string | null;

  @column.dateTime()
  declare startDate: DateTime;

  @column.dateTime()
  declare endDate: DateTime;

  @column()
  declare firstFormId: number | null;

  @column()
  declare lat: number | null;

  @column()
  declare long: number | null;

  @column()
  declare primaryColor: string | null;

  @column()
  declare organizer: string | null;

  @column()
  declare participantsCount: number | null;

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime;

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime;

  @belongsTo(() => Admin)
  declare admin: BelongsTo<typeof Admin>;

  // @belongsTo(() => Form)
  // public firstForm: BelongsTo<typeof Form>;

  @hasMany(() => Participant)
  declare participants: HasMany<typeof Participant>;

  @afterCreate()
  public static async generateSlug(event: Event) {
    if (event.name && !event.slug) {
      event.slug = string.slug(`${event.name}-${event.id}`);
      await event.save();
    }
  }
}
