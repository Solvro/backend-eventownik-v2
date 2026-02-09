export const EventCategories = {
  PARTY: "party",
  INTEGRATION: "integration",
  TRIP: "trip",
  LECTURE: "lecture",
  SPORT: "sport",
  COURSE: "course",
  HACKATHON: "hackathon",
  FAIR: "fair",
} as const;

export type EventCategory =
  (typeof EventCategories)[keyof typeof EventCategories];

export const ALLOWED_EVENT_CATEGORIES = Object.values(EventCategories);
