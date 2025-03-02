export function filterObjectFields<T extends Record<string, unknown>>(
  object: T,
  allowedFields: (keyof T)[],
): Partial<T> {
  return Object.fromEntries(
    Object.entries(object).filter(([key]) =>
      allowedFields.includes(key as keyof T),
    ),
  ) as Partial<T>;
}
