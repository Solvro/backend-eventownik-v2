export const EventCategories = {
  PARIES: "paries",
  TRIPS: "trips",
  RECRUITMENT: "recruitment",
  EDUCATIONAL: "educational",
  SPORT: "sport",
  VOULUNTEERING: "volunteering",
  OTHER: "other",
} as const;

export type EventCategory =
  (typeof EventCategories)[keyof typeof EventCategories];

export const ALLOWED_EVENT_CATEGORIES = Object.values(EventCategories);
