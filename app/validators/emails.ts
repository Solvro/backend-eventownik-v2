import vine from '@vinejs/vine';

export const emailsStoreValidator = vine.compile(
  vine.object({
    eventId: vine.number(),
    name: vine.string(),
    content: vine.string(),
    trigger: vine.enum(['participant_registered', 'participant_deleted', 'form_filled', 'attribute_changed']),
    triggerValue: vine
      .string()
      .optional()
      .requiredWhen('trigger', '=', 'form_filled')
      .requiredWhen('trigger', '=', 'attribute_changed')
  })
);

export const emailsUpdateValidator = vine.compile(
  vine.object({
    eventId: vine.number().optional(),
    name: vine.string().optional(),
    content: vine.string().optional(),
    trigger: vine.enum(['participant_registered', 'form_filled', 'attribute_changed']).optional(),
    triggerValue: vine
      .string()
      .optional()
      .requiredWhen('trigger', '=', 'form_filled')
      .requiredWhen('trigger', '=', 'attribute_changed')
  })
);
