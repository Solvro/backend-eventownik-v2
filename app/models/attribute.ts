import { BaseModel, column, manyToMany, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo, ManyToMany } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'

import ParticipantAttribute from '#models/participant_attribute'
import Event from '#models/event'
import Form from '#models/form'
import Block from '#models/block'

export default class Attribute extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare name: string

  @column()
  declare slug: string | null

  @column()
  declare eventId: number | null

  @column()
  declare options: object | null

  @column()
  declare type: string | null

  @column()
  declare rootBlockId: number | null

  @belongsTo(() => Event, {
    foreignKey: 'eventId',
  })
  public event!: BelongsTo<typeof Event>

  @belongsTo(() => Block, {
    foreignKey: 'rootBlockId',
  })
  public rootBlock!: BelongsTo<typeof Block>

  @manyToMany(() => Form, {
    pivotTable: 'form_definition',
   })
  public forms!: ManyToMany<typeof Form>

  @manyToMany(() => ParticipantAttribute, {
    pivotTable: 'participant_attribute',
    pivotColumns: ['value'],
  })
  public participantAttributes!: ManyToMany<typeof ParticipantAttribute>

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}