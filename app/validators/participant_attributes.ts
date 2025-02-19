import vine from "@vinejs/vine";

export const participantAttributesStoreValidator = vine.compile(
    vine.object({
        participantAttributes: vine.array(
            vine.object(
                {
                    attributeId: vine.number(),
                    value: vine.string()

                }
            )
        )
    })
)

export const participantAttributesUpdateValidator = vine.compile(
    vine.object({
        participantAttributes: vine.array(
            vine.object(
                {
                    id: vine.number(),
                    value: vine.string()
                }
            )
        ).optional()
    })
)