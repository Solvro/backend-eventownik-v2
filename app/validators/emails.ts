import vine from '@vinejs/vine';

export const emailsStoreValidator = vine.compile(
  vine.object({
    eventId: vine.number().optional(),
    name: vine.string(),
    content: vine.string(),
    trigger: vine.enum(['participant_registered', 'form_filled', 'attribute_changed']),
    triggerValue: vine.string().optional(),
  })
);

export const emailsUpdateValidator = vine.compile(
  vine.object({
    eventId: vine.number().optional(),
    name: vine.string().optional(),
    content: vine.string().optional(),
    trigger: vine.enum(['participant_registered', 'form_filled', 'attribute_changed']).optional(),
    triggerValue: vine.string().optional(),
  })
);
